"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { User, UserRoles, UserProfiles } from "@/types/user";
import type { AdminUser } from "@/types/admin";

interface AccountBtnProps {
  user: User | null;
  roles: UserRoles | null;
  profiles: UserProfiles | null;
  isAuthedAdmin: boolean;
  isAuthedUser: boolean;
  adminUser: AdminUser | null;
  handleSignout: () => void;
}

export default function AccountBtn({
  user,
  roles,
  isAuthedAdmin,
  isAuthedUser,
  adminUser,
  handleSignout,
}: AccountBtnProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <>
      {isAuthedAdmin ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-black text-white rounded-full hover:opacity-90"
          >
            <span className="text-0 hidden sm:block">
              {adminUser?.name || adminUser?.username}
            </span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl shadow-[var(--shadow-lg)] bg-black text-white overflow-hidden z-50 ring-1 ring-red/20">
              <div className="px-4 py-3 border-b border-white/5 bg-black/95">
                <div className="text-xs text-white/80">Administrator</div>
                <div className="text-sm font-medium truncate">
                  {adminUser?.name || adminUser?.username}
                </div>
              </div>
              <div className="py-2">
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  Users
                </Link>
                <Link
                  href="/admin/cars"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  Cars
                </Link>
                <Link
                  href="/admin/reports"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/market-price"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  Upload Market Price
                </Link>
                <Link
                  href="/admin/ip-whitelists"
                  className="block px-4 py-2 text-sm hover:bg-maroon/30"
                >
                  IP Whitelists
                </Link>
              </div>
              <div className="border-t border-white/5">
                <button
                  onClick={handleSignout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-maroon/60 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                    <path
                      d="M12 15l3-3m0 0l-3-3m3 3H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isAuthedUser ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-maroon text-white rounded-full hover:bg-red transition-colors shadow-sm"
          >
            <span className="text-0 hidden sm:block font-medium">
              {user?.username}
            </span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden z-50">
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-maroon to-red border-b border-red/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-6 h-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/90 font-medium">
                      Signed in as
                    </div>
                    <div className="text-sm text-white font-semibold truncate">
                      {user?.name || user?.username || user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                {roles && !roles.buyer && !roles.seller && (
                  <div className="px-4 py-3 bg-amber-50 border-y border-amber-200">
                    <Link
                      href={"/signup/role"}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 text--1 font-medium text-amber-900 hover:text-maroon"
                    >
                      <span>Continue where you left off</span>
                    </Link>
                  </div>
                )}

                {roles?.buyer && (
                  <Link
                    href="/favorites"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.83a4 4 0 010-5.655z" />
                    </svg>
                    <span className="font-medium">Favorites</span>
                  </Link>
                )}

                {roles?.buyer && (
                  <Link
                    href="/recent_views"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                    <span className="font-medium">View Public Profile</span>
                  </Link>
                )}

                {roles?.seller && (
                  <Link
                    href="/listings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3a65.25 65.25 0 0113.36 1.412.75.75 0 01.58.875 48.645 48.645 0 01-1.618 6.2.75.75 0 01-.712.513H6a2.503 2.503 0 00-2.292 1.5H17.25a.75.75 0 010 1.5H2.76a.75.75 0 01-.748-.807 4.002 4.002 0 012.716-3.486L3.626 2.716a.25.25 0 00-.248-.216H1.75A.75.75 0 011 1.75zM6 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span className="font-medium">My Listings</span>
                  </Link>
                )}
              </div>

              {(roles?.buyer || roles?.seller) && (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                  <div className="flex-1">
                    <div className="font-medium">Account Settings</div>
                  </div>
                </Link>
              )}

              {/* Sign Out */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-x-(--space-2xs)">
          <Link
            href="/signin"
            className="text-0 font-medium text-gray-700 hover:text-maroon border border-gray-300 rounded-full transition-colors px-(--space-s) py-(--space-3xs-2xs)"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center text-white text-0 font-medium py-(--space-3xs-2xs) px-(--space-m) bg-maroon rounded-full hover:bg-red transition-colors shadow-sm"
          >
            Sign Up
          </Link>
        </div>
      )}
    </>
  );
}
