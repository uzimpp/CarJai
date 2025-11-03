"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Fragment } from "react";
import type { User, UserRoles, UserProfiles } from "@/types/user";
import type { AdminUser } from "@/types/admin";
import { adminMenuItems } from "@/constants/adminMenu";

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
      {/* Overlay that covers the whole page when dropdown is open */}
      <div
        className={`fixed inset-0 bg-[#000000]/8 z-[45] pointer-events-none transition-opacity duration-500 ease-in-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative" ref={menuRef}>
        {isAuthedAdmin || isAuthedUser ? (
          <Fragment>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-black text-white rounded-full hover:opacity-90 ${
                isAuthedAdmin ? "bg-black" : "bg-maroon"
              }`}
            >
              <span className="text-0 hidden sm:block">
                {isAuthedAdmin
                  ? adminUser?.name || adminUser?.username
                  : user?.name || user?.username}
              </span>
            </button>
            {open && (
              <div className="absolute right-0 mt-[var(--space-s-m)] p-(--space-2xs) w-60 rounded-xl shadow-[var(--shadow-md)] text-0 bg-black text-white overflow-hidden z-50">
                {/* <div className="border-b border-white/5 bg-black/95">
                <div className="text--1 text-white/80">
                  {isAuthedAdmin ? "Administrator" : "User"}
                </div>
              </div> */}
                <div className="flex flex-col gap-y-(--space-2xs)">
                  {isAuthedAdmin && (
                    <Fragment>
                      {adminMenuItems.map((item: any) => (
                        <Link
                          href={item.href}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  hover:bg-maroon/30"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </Fragment>
                  )}
                  {isAuthedUser && roles && (
                    <Fragment>
                      {!roles.buyer && !roles.seller && (
                        <div className="px-(--space-xs) py-(--space-2xs) rounded-lg bg-amber-50 border-y border-amber-200">
                          <Link
                            href={"/signup/role"}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2  text-amber-900 hover:text-maroon"
                          >
                            <span>Continue where you left off</span>
                          </Link>
                        </div>
                      )}

                      {roles?.buyer && (
                        <Link
                          href="/favorites"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.83a4 4 0 010-5.655z" />
                          </svg>
                          <span className="">Favorites</span>
                        </Link>
                      )}

                      {roles?.buyer && (
                        <Link
                          href="/recent_views"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.4}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Recent Views</span>
                        </Link>
                      )}

                      {roles?.seller && (
                        <Link
                          href={`/seller/${user?.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
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
                    </Fragment>
                  )}
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleSignout();
                    }}
                    className={`w-full text-left gap-(--space-xs) px-(--space-xs) py-(--space-2xs) rounded-lg  border-t flex items-center ${
                      isAuthedAdmin
                        ? "bg-black hover:bg-maroon/30 border-white/5 "
                        : "text-red-600 hover:bg-red-50 border-gray-100"
                    }`}
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
              </div>
            )}
          </Fragment>
        ) : (
          <div className="flex items-center gap-x-(--space-2xs)">
            <Link
              href="/signin"
              className="text-0 text-gray-700 hover:text-maroon border border-gray-300 rounded-full transition-colors px-(--space-s) py-(--space-3xs-2xs)"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center justify-center text-white text-0 py-(--space-3xs-2xs) px-(--space-m) bg-maroon rounded-full hover:bg-red transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
