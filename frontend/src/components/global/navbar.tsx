"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useUserAuth";

export default function NavBar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
          หน้าหลัก
        </Link>
        <Link
          href="/about-us"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          เกี่ยวกับเรา
        </Link>
        <Link
          href="/buy"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          ซื้อ/ขายรถ
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-x-(--space-2xs)">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-maroon"></div>
            <span className="text-sm text-gray-600">กำลังโหลด...</span>
          </div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-x-(--space-s)">
            <Link
              href="/dashboard"
              className="flex items-center gap-x-(--space-2xs) hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-maroon rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.email}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-x-(--space-s)">
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="flex items-center justify-center text-white py-(--space-2xs) px-(--space-s) bg-maroon rounded-full hover:bg-red transition-colors"
            >
              สมัครบัญชี
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
