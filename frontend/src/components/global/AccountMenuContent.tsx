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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.83a4 4 0 010-5.655z" />
              </svg>
              <span>Favorites</span>
            </Link>
          )}

          {roles?.buyer && (
            <Link
              href="/history"
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.83a4 4 0 010-5.655z" />
              </svg>
              <span className="font-medium">Recent Views</span>
            </Link>
          )}

          {roles?.seller && (
            <Link
              href={`/seller/${user?.id}`}
              onClick={onNavigate}
              className={`flex items-center gap-(--space-xs) px-(--space-2xs) py-(--space-2xs) rounded-lg transition-colors ${
                baseColor ?? ""
              } ${activeColor ?? "hover:bg-maroon/10 hover:text-maroon"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a4 4 0 110 8 4 4 0 010-8zm-6 14a6 6 0 1112 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1z"
                  clipRule="evenodd"
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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3a65.25 65.25 0 0113.36 1.412.75.75 0 01.58.875 48.645 48.645 0 01-1.618 6.2.75.75 0 01-.712.513H6a2.503 2.503 0 00-2.292 1.5H17.25a.75.75 0 010 1.5H2.76a.75.75 0 01-.748-.807 4.002 4.002 0 012.716-3.486L3.626 2.716a.25.25 0 00-.248-.216H1.75A.75.75 0 011 1.75zM6 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Account Settings</span>
            </Link>
          )}
        </>
      )}
      <div className={`h-px ${lineColor}`} />

      <button
        onClick={async () => {
          await handleSignout();
          onNavigate?.();
        }}
        className={`w-full text-left gap-(--space-xs) px-(--space-s) py-(--space-2xs) rounded-md flex items-center ${signoutClass} `}
      >
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign Out
      </button>
    </div>
  );
}
