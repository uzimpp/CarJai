import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header
      className="!pb-(--space-l) px-(--space-m) py-(--space-s) gap-y-(--space-2xl-4xl)
    max-w-[1536px] mx-auto w-full flex justify-between flex-row items-center"
    >
      <div className="flex flex-row items-center gap-x-(--space-4xs)">
        <Image src="/logo/logo.png" alt="logo" width={32} height={32} />
        <h1 className="step-4 font-bold">arJai</h1>
      </div>

      <nav className="flex flex-row gap-x-(--space-s-l) items-center">
        <Link href="/" className="text-gray-700">
          หน้าหลัก
        </Link>
        <Link href="/about-us" className="text-gray-700">
          เกี่ยวกับเรา
        </Link>
        <Link href="/about-us" className="text-gray-700">
          ซื้อ/ขายรถ
        </Link>
        <Link
          href="/signup"
          className="flex items-center justify-center text-white py-(--space-2xs) px-(--space-s) bg-maroon rounded-full"
        >
          สมัครบัญชี
        </Link>
      </nav>
    </header>
  );
}
