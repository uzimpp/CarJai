"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRef, useEffect, useState } from "react";
import { adminMenuItems } from "@/constants/adminMenu";
interface SideBarProps {
  onWidthChange?: (width: number) => void;
}

export default function SideBar({ onWidthChange }: SideBarProps) {
  const pathname = usePathname();
  const { adminUser, signout } = useAdminAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Measure sidebar width and notify parent
  useEffect(() => {
    const updateWidth = () => {
      if (sidebarRef.current && onWidthChange) {
        onWidthChange(sidebarRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [onWidthChange, isCollapsed]);

  const handleSignout = async () => {
    try {
      await signout();
    } catch {
      // Silent fail on signout
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 top-0 h-full bg-black shadow-lg transition-all duration-700 ease-in-out z-40 overflow-visible flex flex-col p-(--space-xs) gap-y-(--space-xs) text-white`}
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
        {adminMenuItems.map((item: any) => {
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
  );
}
