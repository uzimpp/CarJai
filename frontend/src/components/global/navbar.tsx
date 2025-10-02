"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import SearchBar from "@/components/global/SearchBar";
import AccountBtn from "@/components/global/AccountBtn";

const noSearchBarPages = ["/", "/buy"];

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

  const handleSignout = async () => {
    try {
      if (isAuthedAdmin) {
        await adminSignout();
      } else if (isAuthedUser) {
        await userSignout();
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="flex justify-between flex-row items-center bg-white px-(--space-s-m) py-(--space-s) max-w-[1536px] mx-auto">
      <div className="flex flex-row items-center gap-x-(--space-4xs)">
        <Link
          href="/"
          className="flex flex-row items-center gap-x-(--space-4xs)"
        >
          <Image src="/logo/logo.png" alt="logo" width={32} height={32} />
          <h1 className="text-1 font-semibold ml-(--space-3xs)">arJai</h1>
        </Link>
      </div>

      {shouldShowSearchBar && (
        <div className="flex-1 max-w-md mx-(--space-l)">
          <SearchBar className="bg-maroon/20" placeholder="Search cars..." />
        </div>
      )}

      <nav className="flex flex-row gap-x-(--space-m-l) items-center">
        <Link
          href="/"
          className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
        >
          Home
        </Link>
        <Link
          href="/buy"
          className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
        >
          Browse Cars
        </Link>
        <Link
          href="/sell"
          className="text-0 text-gray-700 hover:text-maroon transition-colors font-medium"
        >
          Sell Cars
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
    </div>
  );
}
