"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import NavBar from "@/components/global/NavBar";
import SideBar from "@/components/global/SideBar";
import Footer from "@/components/global/Footer";
import Signup from "@/components/auth/Signup";
import ComparisonButton from "@/components/comparison/ComparisonButton";
import { Fragment } from "react";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  // Don't show step indicator on the initial signup page for unauthenticated users
  const headRef = useRef<HTMLHeadElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default to 256px (w-64)
  const [isMobile, setIsMobile] = useState(false);
  const ADMIN_MOBILE_NAV_HEIGHT = 56; // fixed px height for admin mobile top navbar

  // Determine current step based on pathname
  const getCurrentStep = () => {
    if (pathname === "/signup") return 1;
    if (pathname === "/signup/role") return 2;
    if (pathname.startsWith("/signup/role/")) return 3;
    return 1;
  };
  const currentStep = getCurrentStep();

  // Check if we're on an admin page (excluding signin)
  const isAdminPage =
    pathname.startsWith("/admin") && pathname !== "/admin/signin";

  // Define pages where only navbar should appear (no footer)
  const hideFooterPages = [
    "/admin/dashboard",
    "/admin/account",
    "/admin/signin",
    "/admin/users",
    "/admin/cars",
    "/admin/reports",
    "/admin/market-price",
    "/admin/ip-whitelists",
    "/signin",
    "/signup",
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
    "/reset-password",
    "/404",
  ];

  // Define pages where only footer should appear (no navbar)
  const hideNavbarPages = [
    "/admin/signin",
    "/admin/dashboard",
    "/admin/account",
    "/admin/users",
    "/admin/cars",
    "/admin/reports",
    "/admin/market-price",
    "/admin/ip-whitelists",
    "/signin",
    "/signup",
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
    "/reset-password",
    "/404",
  ];

  // Define pages where navbar and footer should NOT appear
  const showStepIndicator = [
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
  ];

  const shouldShowNavbar = !hideNavbarPages.includes(pathname) && !isAdminPage;
  const shouldShowFooter = !hideFooterPages.includes(pathname) && !isAdminPage;
  const shouldShowStepIndicator = showStepIndicator.includes(pathname);
  const shouldShowSidebar = isAdminPage;

  // Measure navbar height
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(
        typeof window !== "undefined" ? window.innerWidth < 768 : false
      );
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    const updateHeaderHeight = () => {
      if (headRef.current) {
        setHeaderHeight(headRef.current.offsetHeight);
      }
    };
    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };
    // Update on mount and when pathname changes
    updateHeaderHeight();
    updateFooterHeight();
    // Update on window resize
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      window.removeEventListener("resize", updateIsMobile);
    };
  }, [pathname, shouldShowNavbar]);

  // Measure footer height
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };

    // Update on mount and when pathname changes
    updateFooterHeight();

    // Update on window resize
    window.addEventListener("resize", updateFooterHeight);
    return () => window.removeEventListener("resize", updateFooterHeight);
  }, [pathname, shouldShowFooter]);

  return (
    <Fragment>
      {/* Admin Sidebar */}
      {shouldShowSidebar && (
        <SideBar onWidthChange={setSidebarWidth} isMobile={isMobile} />
      )}

      <header
        className="fixed top-0 left-0 right-0 z-100"
        ref={headRef as React.RefObject<HTMLHeadElement>}
        style={
          shouldShowSidebar && !isMobile
            ? { marginLeft: `${sidebarWidth}px` }
            : {}
        }
      >
        <div className="max-w-[1536px] w-full mx-auto">
          {shouldShowNavbar && <NavBar />}
          {shouldShowStepIndicator && <Signup currentStep={currentStep} />}
        </div>
      </header>

      <main
        className="flex-1 flex justify-center w-full rounded-b-4xl bg-white z-50"
        style={{
          paddingTop: `${
            shouldShowStepIndicator || shouldShowNavbar
              ? headerHeight
              : isAdminPage
              ? isMobile
                ? ADMIN_MOBILE_NAV_HEIGHT
                : 0
              : 0
          }px`,
          marginBottom: shouldShowFooter ? `calc(${footerHeight}px - 5rem)` : 0,
          marginLeft: shouldShowSidebar && !isMobile ? `${sidebarWidth}px` : 0,
        }}
      >
        {children}
      </main>

      <footer
        className="z-0 fixed bottom-0 left-0 right-0 w-full bg-dark-grey"
        ref={footerRef as React.RefObject<HTMLElement>}
        style={
          shouldShowSidebar && !isMobile
            ? { marginLeft: `${sidebarWidth}px` }
            : {}
        }
      >
        {shouldShowFooter && <Footer />}
      </footer>

      {/* Comparison Bar - shows when cars are selected for comparison */}
      {!isAdminPage && <ComparisonButton />}
    </Fragment>
  );
}
