"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User, UserRoles } from "@/types/user";
import type { AdminUser } from "@/types/admin";
import { adminMenuItems } from "@/constants/adminMenu";

interface AccountMenuContentProps {
  user: User | null;
  roles: UserRoles | null;
  isAuthedAdmin: boolean;
  isAuthedUser: boolean;
  adminUser: AdminUser | null;
  handleSignout: () => void | Promise<void>;
  onNavigate?: () => void;
  // Optional style overrides for link states
  baseColor: string; // e.g., "text-grey"
  activeColor: string; // e.g., "bg-maroon/10 text-maroon"
  signoutClass: string; // e.g., "text-red-600"
  lineColor?: string; // e.g., "bg-grey/10"
}

export default function AccountMenuContent({
  user,
  roles,
  isAuthedAdmin,
  isAuthedUser,
  adminUser,
  handleSignout,
  onNavigate,
  baseColor,
  activeColor,
  signoutClass,
  lineColor = "bg-grey/10",
}: AccountMenuContentProps) {
  const pathname = usePathname();

  // Filter admin menu items based on role (same logic as SideBar)
  const filteredAdminMenuItems = adminMenuItems.filter((item) => {
    if (!item.requiredRole) return true;
    return adminUser?.role === item.requiredRole;
  });

  return (
    <div className="flex flex-col gap-y-(--space-2xs)">
      {isAuthedAdmin && adminUser && (
        <>
          {filteredAdminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const activeCls = activeColor ?? "bg-maroon text-white";
            const idleCls = `${baseColor ?? ""} ${
              activeColor ?? "hover:bg-maroon/10 hover:text-maroon"
            }`.trim();
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors
                    ${isActive ? activeCls : idleCls}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </>
      )}

      {isAuthedUser && roles && (
        <>
          {!roles.buyer && !roles.seller && (
            <Link
              href={"/signup/role"}
              onClick={onNavigate}
              className="px-(--space-xs) py-(--space-2xs) rounded-lg bg-amber-50 ring-1 ring-amber-100 text-amber-900"
            >
              Continue where you left off
            </Link>
          )}

          {roles?.buyer && (
            <Link
              href="/favorites"
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>Favorites</span>
            </Link>
          )}

          {roles?.buyer && (
            <Link
              href="/history"
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Recent Views</span>
            </Link>
          )}

          {roles?.seller && (
            <Link
              href={`/seller/${user?.id}`}
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>View Public Profile</span>
            </Link>
          )}

          {roles?.seller && (
            <Link
              href="/listings"
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span>My Listings</span>
            </Link>
          )}

          {(roles?.buyer || roles?.seller) && (
            <Link
              href="/settings"
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Account Settings</span>
            </Link>
          )}
        </>
      )}

      {(isAuthedAdmin || isAuthedUser) && (
        <>
          <div className={`h-px ${lineColor}`} />
          <button
            onClick={async () => {
              await handleSignout();
              onNavigate?.();
            }}
            className={`w-full text-left gap-(--space-xs) px-(--space-s) py-(--space-2xs) rounded-md flex items-center ${signoutClass} `}
          >
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
