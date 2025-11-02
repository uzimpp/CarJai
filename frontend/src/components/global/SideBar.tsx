"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRef, useEffect, useState } from "react";

interface SideBarProps {
  onWidthChange?: (width: number) => void;
}

export default function SideBar({ onWidthChange }: SideBarProps) {
  const pathname = usePathname();
  const { adminUser, signout, isAuthenticated } = useAdminAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const menuItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-6.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      href: "/admin/cars",
      label: "Cars",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24.00 24.00" fill="none">
          <path
            d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/reports",
      label: "Fraud Reports",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
      ),
    },
    {
      href: "/admin/market-price",
      label: "Market Price",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
    },
    {
      href: "/admin/ip-whitelists",
      label: "IP Whitelists",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 top-0 h-full bg-black shadow-lg transition-all duration-700 ease-in-outz-40 overflow-visible flex flex-col p-(--space-xs) gap-y-(--space-xs) text-white`}
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
        {menuItems.map((item) => {
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
