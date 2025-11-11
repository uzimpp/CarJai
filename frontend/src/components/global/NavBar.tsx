"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import SearchBar from "@/components/global/SearchBar";
import AccountBtn from "@/components/global/AccountBtn";
import AccountMenuContent from "@/components/global/AccountMenuContent";

const noSearchBarPages = ["/", "/browse"];

export default function NavBar() {
  const pathname = usePathname();
  const {
    user,
    roles,
    profiles,
    isAuthenticated: isUserAuthed,
    signout: userSignout,
    isLoading: isUserLoading,
  } = useUserAuth();
  const {
    adminUser,
    isAuthenticated: isAdminAuthed,
    signout: adminSignout,
    loading: isAdminLoading,
  } = useAdminAuth();

  const isLoading = isUserLoading || isAdminLoading;
  const isAuthedAdmin = !!isAdminAuthed;
  const isAuthedUser = !isAuthedAdmin && !!isUserAuthed; // prioritize admin if both somehow true

  // Determine if search bar should be shown
  const shouldShowSearchBar = !noSearchBarPages.includes(pathname);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Close the mobile menu when resizing to desktop or on route changes
  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignout = async () => {
    try {
      if (isAuthedAdmin) {
        await adminSignout();
      } else if (isAuthedUser) {
        await userSignout();
      }
    } catch {
      // Silent fail on signout
    }
  };

  return (
    <>
      <div className="top-0 left-0 right-0 bg-white md:mx-(--space-s-m) md:rounded-b-4xl shadow-sm z-50">
        <div className="relative flex justify-between flex-row items-center p-(--space-2xs-s) px-(--space-s-m) w-full rounded-b-4xl">
        <div className="flex flex-row items-center gap-x-(--space-4xs) md:px-(--space-s)">
          <Link
            href="/"
            className="flex flex-row items-center gap-x-(--space-4xs)"
          >
              <div className="relative w-(--space-m-l) h-(--space-m-l)">
              <Image
                src="/logo/logo.png"
                alt="logo"
                fill
                quality={100}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-1 font-semibold ml-(--space-3xs) hidden md:block">
              arJai
            </h1>
          </Link>
        </div>

        {shouldShowSearchBar && (
          <div className="flex-1 max-w-md mx-(--space-l)">
              <SearchBar
                className="bg-maroon/20"
                placeholder="Search cars..."
              />
          </div>
        )}

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-row gap-x-(--space-m-l) items-center">
          {/* <Link
            href="/"
            className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
          >
            Home
          </Link> */}
          <Link
            href="/browse"
            className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
          >
            Browse Cars
          </Link>
          <Link
            href="/about-us"
            className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
          >
            About
          </Link>

          {isLoading ? (
            <div className="flex items-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-maroon/10 rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maroon"></div>
            </div>
          ) : (
            <AccountBtn
              user={user}
              roles={roles}
              profiles={profiles}
              isAuthedAdmin={isAuthedAdmin}
              isAuthedUser={isAuthedUser}
              adminUser={adminUser}
              handleSignout={handleSignout}
            />
          )}
        </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-(--space-2xs) rounded-md text-gray-700 hover:bg-maroon/10 hover:text-maroon transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Mobile menu panel */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute right-0 top-full w-full bg-white rounded-b-xl shadow-sm z-50">
              <div className="flex flex-col p-(--space-s) pt-0 gap-y-(--space-2xs)">
                <Link
                  href="/browse"
                  className="px-(--space-s) py-(--space-2xs) rounded-md text-0 text-gray-800 hover:bg-maroon/10 hover:text-maroon transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Cars
                </Link>
                <Link
                  href="/about-us"
                  className="px-(--space-s) py-(--space-2xs) rounded-md text-0 text-gray-800 hover:bg-maroon/10 hover:text-maroon transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="h-px bg-gray-200 my-(--space-2xs)" />
                {isLoading ? (
                  <div className="flex items-center justify-center gap-x-(--space-2xs) px-(--space-s) py-(--space-2xs) bg-maroon/10 rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maroon"></div>
                  </div>
                ) : (
                  <AccountMenuContent
                    user={user}
                    roles={roles}
                    isAuthedAdmin={isAuthedAdmin}
                    isAuthedUser={isAuthedUser}
                    adminUser={adminUser}
                    handleSignout={async () => {
                      await handleSignout();
                      setIsMobileMenuOpen(false);
                    }}
                    onNavigate={() => setIsMobileMenuOpen(false)}
                    baseColor="text-grey"
                    activeColor="hover:text-maroon hover:text-maroon"
                    signoutClass="text-red-600 hover:bg-red-50 hover:text-red-700"
                  />
                )}
              </div>
              {/* iOS safe area spacer */}
              <div className="h-[env(safe-area-inset-bottom)]" />
            </div>
          )}
        </div>
      </div>
      {/* <div
        className={`absolute left-0 right-0 bottom-0 top-full bg-[#000000]/15 transition-opacity duration-500 ease-in-out ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } z-40`}
        onClick={() => setIsMobileMenuOpen(false)}
      /> */}
    </>
  );
}
