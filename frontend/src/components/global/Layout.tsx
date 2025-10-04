"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import NavBar from "@/components/global/NavBar";
import Footer from "@/components/global/Footer";
import Signup from "@/components/auth/Signup";
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

  // Determine current step based on pathname
  const getCurrentStep = () => {
    if (pathname === "/signup") return 1;
    if (pathname === "/signup/role") return 2;
    if (pathname.startsWith("/signup/role/")) return 3;
    return 1;
  };
  const currentStep = getCurrentStep();

  // Define pages where only navbar should appear (no footer)
  const hideFooterPages = [
    "/admin/dashboard",
    "/admin/signin",
    "/signin",
    "/signup",
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
    "/404",
  ];

  // Define pages where only footer should appear (no navbar)
  const hideNavbarPages = [
    "/admin/signin",
    "/admin/dashboard",
    "/signin",
    "/signup",
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
    "/404",
  ];

  // Define pages where navbar and footer should NOT appear
  const showStepIndicator = [
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
  ];

  const shouldShowNavbar = !hideNavbarPages.includes(pathname);
  const shouldShowFooter = !hideFooterPages.includes(pathname);
  const shouldShowStepIndicator = showStepIndicator.includes(pathname);

  // Measure navbar height
  useEffect(() => {
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
    return () => window.removeEventListener("resize", updateHeaderHeight);
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
      <header
        className="fixed top-0 left-0 right-0 z-100"
        ref={headRef as React.RefObject<HTMLHeadElement>}
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
            shouldShowStepIndicator || shouldShowNavbar ? headerHeight : 0
          }px`,
          marginBottom: shouldShowFooter
            ? `calc(${footerHeight}px - 12rem)`
            : 0,
        }}
      >
        {children}
      </main>

      <footer
        className="z-0 fixed bottom-0 left-0 right-0 w-full bg-[#181414]"
        ref={footerRef as React.RefObject<HTMLElement>}
      >
        {shouldShowFooter && <Footer />}
      </footer>
    </Fragment>
  );
}
