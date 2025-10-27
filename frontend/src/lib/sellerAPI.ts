import type { Seller, SellerContact } from "@/types/user";
import type { CarListing } from "@/types/Car";

// Public seller API - uses relative paths to flow through Next rewrites
export const sellerAPI = {
  async getSeller(id: string): Promise<{
    success: boolean;
    data: { seller: Seller; contacts: SellerContact[] };
  }> {
    const res = await fetch(`/api/sellers/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Seller not found");
    return res.json();
  },

  async getSellerContacts(id: string): Promise<{
    success: boolean;
    contacts: SellerContact[];
  }> {
    const res = await fetch(`/api/sellers/${id}/contacts`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      // Normalize to empty contacts on failure
      return { success: false, contacts: [] };
    }
    return res.json();
  },

  async getSellerCars(id: string): Promise<{
    success: boolean;
    cars: CarListing[];
  }> {
    const res = await fetch(`/api/sellers/${id}/cars`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { success: false, cars: [] };
    }
    const data = await res.json();
    return {
      success: Boolean(data?.success),
      cars: (data?.cars || []) as CarListing[],
    };
  },
};
