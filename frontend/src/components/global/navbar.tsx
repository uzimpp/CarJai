"use client";

import Link from "next/link";
import Image from "next/image";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useEffect, useRef, useState } from "react";

export default function NavBar() {
  const {
    user,
    isAuthenticated: isUserAuthed,
    logout: userLogout,
    isLoading: isUserLoading,
  } = useUserAuth();
  const {
    adminUser,
    isAuthenticated: isAdminAuthed,
    logout: adminLogout,
    loading: isAdminLoading,
  } = useAdminAuth();

  const isLoading = isUserLoading || isAdminLoading;
  const isAuthedAdmin = !!isAdminAuthed;
  const isAuthedUser = !isAuthedAdmin && !!isUserAuthed; // prioritize admin if both somehow true

  const handleLogout = async () => {
    try {
      if (isAuthedAdmin) {
        await adminLogout();
      } else if (isAuthedUser) {
        await userLogout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Dropdown state + click outside
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <header
      className="!pb-(--space-l) px-(--space-m) py-(--space-s) gap-y-(--space-2xl-4xl)
    max-w-[1536px] mx-auto w-full flex justify-between flex-row items-center"
    >
      <div className="flex flex-row items-center gap-x-(--space-4xs)">
        <Link
          href="/"
          className="flex flex-row items-center gap-x-(--space-4xs)"
        >
          <Image src="/logo/logo.png" alt="logo" width={32} height={32} />
          <h1 className="step-4 font-bold">arJai</h1>
        </Link>
      </div>

      <nav className="flex flex-row gap-x-(--space-s-l) items-center">
        <Link
          href="/"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/about-us"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          About Us
        </Link>
        <Link
          href="/buy"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          Buy/Sell Cars
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-x-(--space-2xs)">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maroon"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        ) : isAuthedAdmin ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-black text-white rounded-full hover:opacity-90"
            >
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(adminUser?.name || adminUser?.username)
                    ?.charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <span className="text-sm hidden sm:block">
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
                    href="/admin/dashboard#session"
                    className="block px-4 py-2 text-sm hover:bg-maroon/30"
                  >
                    Sessions
                  </Link>
                  <Link
                    href="/admin/dashboard#ip"
                    className="block px-4 py-2 text-sm hover:bg-maroon/30"
                  >
                    IP Whitelist
                  </Link>
                </div>
                <div className="border-t border-white/5">
                  <button
                    onClick={handleLogout}
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
                    Logout Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : isAuthedUser ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-maroon text-white rounded-full hover:bg-red"
            >
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm hidden sm:block">{user?.email}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-(--space-xs) w-60 rounded-xl shadow-[var(--shadow-lg)] bg-maroon text-white overflow-hidden z-50 ring-1 ring-red/20">
                <div className="px-4 py-3 border-b border-red/20 bg-maroon/95">
                  <div className="text-xs text-white/80">User Account</div>
                  <div className="text-sm font-medium truncate">
                    {user?.email}
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm hover:bg-red/20"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/dashboard#orders"
                    className="block px-4 py-2 text-sm hover:bg-red/20"
                  >
                    Purchase History
                  </Link>
                  <Link
                    href="/dashboard#favorites"
                    className="block px-4 py-2 text-sm hover:bg-red/20"
                  >
                    Favorites
                  </Link>
                </div>
                <div className="border-t border-red/20">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red/30 flex items-center gap-2"
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
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/signup"
            className="flex items-center justify-center text-white py-(--space-2xs) px-(--space-s) bg-maroon rounded-full hover:bg-red transition-colors"
          >
            Sign Up
          </Link>
        )}
      </nav>
    </header>
  );
}
