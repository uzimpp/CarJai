import type { Metadata } from "next";
import { Syne } from "next/font/google";
// import localFont from "next/font/local";
import "./globals.css";
import ConditionalLayout from "@/components/global/Layout";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

// const fcSubject = localFont({
//   src: [
//     {
//       path: "../../public/fonts/FC Subject [Non-commercial use] Regular ver 1.00.otf",
//       weight: "400",
//       style: "normal",
//     }
//   ],
//   variable: "--font-fc-subject"
// });

export const metadata: Metadata = {
  title: "CarJai",
  description: "A second-hand car marketplace platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ${fcSubject.variable} var(--font-fc-subject)*/}
      <body className={`${syne.variable} antialiased min-h-screen flex`}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
