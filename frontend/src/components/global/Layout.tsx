"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/global/NavBar";
import Footer from "@/components/global/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

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

  return (
    <>
      {shouldShowNavbar && <NavBar />}
      <main className="flex justify-center">{children}</main>
      {shouldShowFooter && <Footer />}
    </>
  );
}
