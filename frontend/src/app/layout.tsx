import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavBar from "@/components/global/navbar";
import Footer from "@/components/global/footer";

const fcSubject = localFont({
  src: [
    {
      path: "../../public/fonts/FC Subject [Non-commercial use] Regular ver 1.00.otf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-fc-subject"
});

export const metadata: Metadata = {
  title: "CarJai",
  description: "A second-hand car marketplace platform in Thailand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${fcSubject.variable} antialiased`}>
        <NavBar />
        {/* className="!pb-(--space-4xl) px-(--space-m) py-(--space-s)
        max-w-[1728px] mx-auto w-full flex justify-self-center justify-center"  */}
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
