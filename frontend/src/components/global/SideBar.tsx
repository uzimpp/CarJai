"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRef, useEffect, useState } from "react";
import type { RefObject, MutableRefObject } from "react";
import { adminMenuItems } from "@/constants/adminMenu";
import { Fragment } from "react";
interface SideBarProps {
  onWidthChange?: (width: number) => void;
  isMobile?: boolean;
  mobileNavRef?:
    | RefObject<HTMLDivElement | null>
    | MutableRefObject<HTMLDivElement | null>;
}

export default function SideBar({
  onWidthChange,
  isMobile = false,
  mobileNavRef,
}: SideBarProps) {
  const pathname = usePathname();
  const { adminUser, signout } = useAdminAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fallbackMobileRef = useRef<HTMLDivElement>(null);
  const mobileTopRef = mobileNavRef ?? fallbackMobileRef;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Measure sidebar width and notify parent
  useEffect(() => {
    const updateWidth = () => {
      if (!isMobile && sidebarRef.current && onWidthChange) {
        onWidthChange(sidebarRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (!isMobile && sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [onWidthChange, isCollapsed, isMobile]);

  // No runtime height measurement for the mobile navbar; Layout uses a fixed height

  const handleSignout = async () => {
    try {
      await signout();
    } catch {
      // Silent fail on signout
    }
  };

  return (
    <Fragment>
      {!isMobile && (
        <aside
          ref={sidebarRef}
          className={`hidden md:flex fixed left-0 top-0 h-full bg-black shadow-lg transition-all duration-700 ease-in-out z-60 overflow-visible flex-col p-(--space-xs) gap-y-(--space-xs) text-white`}
        >
          {/* Logo Section */}
          <div className={`flex items-center gap-x-(--space-xs)`}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-(--space-xs) rounded-lg hover:bg-maroon transition-colors text-white"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-6 h-6 ${
                  isCollapsed ? "rotate-z-0" : "rotate-z-90"
                }  transition-transform duration-300 ease-in-out`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.4}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {!isCollapsed && (
              <Link href="/" className="text-white text-0 font-medium">
                CarJai
              </Link>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-y-(--space-2xs) overflow-x-visible pt-(--space-xs) border-t border-white/20">
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-x-(--space-xs) p-(--space-xs) rounded-lg transition-colors relative group ${
                      isActive
                        ? "bg-maroon text-white"
                        : "text-white hover:bg-maroon hover:text-white"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="font-medium text--1">{item.label}</span>
                    )}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 text-xs rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-lg">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* User Info & Sign Out */}
          <div className="mt-auto flex flex-col">
            {!isCollapsed && adminUser && (
              <div className="mb-3 px-2">
                <p className="text-red-100 text--1 font-medium mb-1">
                  {adminUser.username}
                </p>
                <p className="text-red-200 text--1">{adminUser.name}</p>
              </div>
            )}
            <button
              onClick={handleSignout}
              className="w-full flex items-center gap-x-(--space-xs) p-(--space-xs) rounded-lg text-white hover:bg-maroon hover:text-white transition-colors group relative"
              title={isCollapsed ? "Sign Out" : undefined}
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
                  strokeWidth={1.4}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {!isCollapsed && (
                <span className="font-medium text--1">Sign Out</span>
              )}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 text-xs rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-lg">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </aside>
      )}
      {isMobile && (
        <div
          ref={mobileTopRef}
          className="md:hidden fixed top-0 left-0 right-0 bg-black text-white z-60 border-b border-white/10"
        >
          <div className="flex items-center justify-between px-(--space-s-m) py-(--space-2xs)">
            <Link href="/" className="text-white text-0 font-medium">
              CarJai
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center p-(--space-2xs) rounded-md hover:bg-white/10"
              aria-label="Toggle admin menu"
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
          </div>

          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full w-full bg-black text-white rounded-b-xl shadow-2xl overflow-hidden">
              <div className="flex flex-col p-(--space-s) gap-y-(--space-2xs)">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-(--space-xs) px-(--space-s) py-(--space-2xs) rounded-md text-0 transition-colors ${
                        isActive
                          ? "bg-maroon text-white"
                          : "text-white hover:bg-maroon hover:text-white"
                      }`}
                    >
                      <span className="w-5 h-5">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div>
                  <div className="h-px bg-white/10 my-(--space-2xs)" />
                </div>
                <button
                  onClick={async () => {
                    await handleSignout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left gap-(--space-xs) px-(--space-s) py-(--space-2xs) rounded-md flex items-center text-white hover:bg-maroon"
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
              <div className="h-[env(safe-area-inset-bottom)]" />
            </div>
          )}
        </div>
      )}
    </Fragment>
  );
}
