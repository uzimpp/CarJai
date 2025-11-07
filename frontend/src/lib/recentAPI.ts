// Recent Views API module
// - Stores locally in localStorage with dedupe and cap of 20
// - Optionally syncs with backend using same apiCall helper
// - Keeps interface similar to other API modules

import { apiCall } from "@/lib/apiCall";

// Local storage key
const LS_KEY = "carjai_recent_views";
const MAX_ITEMS = 20;

export interface RecentSnapshot {
  title?: string;
  price?: number;
  thumbnailId?: number;
  thumbnailUrl?: string;
}

export interface RecentItem {
  carId: number;
  viewedAt: string; // ISO string
  snapshot?: RecentSnapshot;
}

export interface RecentAPIOptions {
  mergeRemote?: boolean; // when getting, merge remote items if authenticated
  syncIfAuthenticated?: boolean; // when adding, try POST to backend
}

function loadLocal(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x?.carId === "number");
  } catch {
    return [];
  }
}

function saveLocal(items: RecentItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

async function tryFetchRemote(limit = MAX_ITEMS): Promise<RecentItem[]> {
  try {
    const res = await apiCall<{
      success: boolean;
      data: Array<{
        car_id: number;
        viewed_at: string;
        brand_name?: string | null;
        model_name?: string | null;
        price: number;
        image_id?: number | null;
      }>;
    }>(`/api/recent-views?limit=${limit}`, { method: "GET" });
    if (!res.success || !res.data) return [];
    return res.data.map((rv) => ({
      carId: rv.car_id,
      viewedAt: rv.viewed_at,
      snapshot: {
        title: [rv.brand_name || "", rv.model_name || ""].filter(Boolean).join(" ") || undefined,
        price: rv.price,
        thumbnailId: rv.image_id ?? undefined,
        thumbnailUrl: rv.image_id ? `/api/cars/images/${rv.image_id}` : undefined,
      },
    }));
  } catch {
    // Likely 401/403 when not authenticated; silently ignore
    return [];
  }
}

async function tryRecordRemote(carId: number): Promise<void> {
  try {
    await apiCall<{ success: boolean; message?: string }>(
      "/api/recent-views/record",
      {
        method: "POST",
        body: JSON.stringify({ car_id: carId }),
      }
    );
  } catch {
    // Ignore failures (e.g., unauthenticated)
  }
}

export const recentAPI = {
  getRecent: async (opts: RecentAPIOptions = {}): Promise<RecentItem[]> => {
    const local = loadLocal();
    if (opts.mergeRemote) {
      const remote = await tryFetchRemote();
      // Merge by carId, keep latest viewedAt, prefer snapshot with thumbnail if available
      const map = new Map<number, RecentItem>();
      const put = (item: RecentItem) => {
        const existing = map.get(item.carId);
        if (!existing) {
          map.set(item.carId, item);
          return;
        }
        // Choose newer viewedAt
        const newer = new Date(item.viewedAt) > new Date(existing.viewedAt) ? item : existing;
        // Merge snapshot, prefer one with thumbnailUrl/Id
        const snap: RecentSnapshot = {
          title: newer.snapshot?.title || existing.snapshot?.title,
          price: newer.snapshot?.price ?? existing.snapshot?.price,
          thumbnailId: newer.snapshot?.thumbnailId ?? existing.snapshot?.thumbnailId,
          thumbnailUrl: newer.snapshot?.thumbnailUrl ?? existing.snapshot?.thumbnailUrl,
        };
        map.set(item.carId, { ...newer, snapshot: snap });
      };
      [...local, ...remote].forEach(put);
      const merged = Array.from(map.values())
        .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
        .slice(0, MAX_ITEMS);
      // Save merged to local for faster subsequent reads
      saveLocal(merged);
      return merged;
    }
    return local.slice(0, MAX_ITEMS);
  },

  addRecent: async (
    carId: number,
    snapshot?: RecentSnapshot,
    opts: RecentAPIOptions = { syncIfAuthenticated: true }
  ): Promise<RecentItem[]> => {
    const now = new Date().toISOString();
    const current = loadLocal();
    // Remove existing entry for carId
    const filtered = current.filter((x) => x.carId !== carId);
    const item: RecentItem = { carId, viewedAt: now, snapshot };
    const updated = [item, ...filtered].slice(0, MAX_ITEMS);
    saveLocal(updated);

    if (opts.syncIfAuthenticated) {
      await tryRecordRemote(carId);
    }
    return updated;
  },

  clearRecent: async (): Promise<void> => {
    saveLocal([]);
    // Optional: could call backend to clear if endpoint exists; not required now
  },
};

export default recentAPI;