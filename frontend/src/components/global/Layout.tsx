"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import NavBar from "@/components/global/NavBar";
import Footer from "@/components/global/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLHeadElement>(null);
  const [navHeight, setNavHeight] = useState(0);

  // Define pages where navbar and footer should NOT appear
  const hideLayoutPages = [
    "/admin/signin",
    "/signin",
    "/signup",
    "/signup/role",
    "/signup/role/buyer",
    "/signup/role/seller",
    "/404",
  ];

  // Define pages where only navbar should appear (no footer)
  const hideFooterPages = ["/admin/dashboard", "/admin/signin"];

  // Define pages where only footer should appear (no navbar)
  const hideNavbarPages = ["/admin/signin"];

  const shouldShowNavbar =
    !hideLayoutPages.includes(pathname) && !hideNavbarPages.includes(pathname);
  const shouldShowFooter =
    !hideLayoutPages.includes(pathname) && !hideFooterPages.includes(pathname);

  // Measure navbar height
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    };

    // Update on mount and when pathname changes
    updateNavHeight();

    // Update on window resize
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, [pathname, shouldShowNavbar]);

  return (
    <>
      {shouldShowNavbar && (
      <header className="fixed top-0 left-0 right-0 pb-(--space-l) max-w-[1536px] mx-auto w-full z-100"
          ref={navRef as React.RefObject<HTMLHeadElement>}
        >
          <NavBar />
        </header>
      )}
      <main
        className="flex justify-center w-full"
        style={{ marginTop: shouldShowNavbar ? `${navHeight}px` : "0" }}
      >
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </>
  );
}
