"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Fragment } from "react";
import type { User, UserRoles, UserProfiles } from "@/types/user";
import type { AdminUser } from "@/types/admin";
import AccountMenuContent from "@/components/global/AccountMenuContent";

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
      <div className="relative" ref={menuRef}>
        {isAuthedAdmin || isAuthedUser ? (
          <Fragment>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) text-white rounded-full hover:opacity-90 ${
                isAuthedAdmin ? "bg-black" : "bg-maroon"
              }`}
            >
              <span className="text-0 hidden sm:block">
                {isAuthedAdmin ? adminUser?.username : user?.username}
              </span>
            </button>
            {open && (
              <div
                className={`absolute right-0 mt-[var(--space-s-m)] p-(--space-2xs) w-70 rounded-xl shadow-[var(--shadow-md)] text-0 overflow-hidden z-50
                  ${
                    isAuthedAdmin
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
              >
                {/* <div className="border-b border-white/5 bg-black/95">
                <div className="text--1 text-white/80">
                  {isAuthedAdmin ? "Administrator" : "User"}
                </div>
              </div> */}
                <AccountMenuContent
                  user={user}
                  roles={roles}
                  isAuthedAdmin={isAuthedAdmin}
                  isAuthedUser={isAuthedUser}
                  adminUser={adminUser}
                  handleSignout={() => {
                    setOpen(false);
                    handleSignout();
                  }}
                  onNavigate={() => setOpen(false)}
                  variant="dropdown"
                />
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
