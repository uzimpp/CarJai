import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/global/searchbar";

export default function Home() {
  return (
    <div className="px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto w-full">
      {/* Hero */}
      <section className="relative rounded-4xl shadow-[var(--shadow-lg)] bg-gradient-to-r from-maroon to-maroon px-(--space-l) py-(--space-2xl-3xl)">
        <div className="relative z-10 flex flex-col items-center text-center gap-y-(--space-s) pb-(--space-xl)">
          <h1 className="text-5 bold text-white">
            Looking for a dream car?
          </h1>
          <div className="w-full max-w-[800px]">
            <SearchBar className="mx-auto" placeholder="รถใช้ในเมือง" />
          </div>
        </div>
        {/* Decorative cars overlay layer (does not affect layout) */}
        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:flex items-end justify-between select-none translate-y-(--space-s-m)">
          <div className="relative basis-[36%] md:basis-[34%] lg:basis-[32%] max-w-[640px] min-w-[240px] aspect-[2.2/1] -translate-x-(--space-xs-s) scale-x-[-1]">
            <Image
              src="/assets/cars/benz_amg.png"
              alt="car-left"
              fill
              quality={100}
              className="object-contain"
              priority
            />
          </div>
          <div className="relative basis-[36%] md:basis-[34%] lg:basis-[32%] max-w-[640px] min-w-[240px] aspect-[2.2/1] translate-x-(--space-s)">
            <Image
              src="/assets/cars/honda_accord.png"
              alt="car-right"
              fill
              quality={100}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* Quick filters */}
      <section className="mt-(--space-l) flex flex-wrap gap-(--space-s)">
        {[
          { label: "รถคันเล็ก", q: "eco" },
          { label: "สำหรับครอบครัว", q: "family" },
          { label: "สมรรถนะสูง", q: "sport" },
          { label: "ประหยัดน้ำมัน", q: "hybrid" },
        ].map((c) => (
          <Link
            key={c.q}
            href={`/buy?q=${encodeURIComponent(c.q)}`}
            className="text-white bg-maroon hover:bg-red px-(--space-s) py-(--space-2xs) rounded-full text--1 transition-colors"
          >
            {c.label}
          </Link>
        ))}
      </section>

      {/* Features */}
      <section className="mt-(--space-xl) grid grid-cols-1 sm:grid-cols-3 gap-(--space-m)">
        {[
          {
            title: "รถหลากหลาย",
            desc: "ครอบคลุมทุกสไตล์ ตั้งแต่รถใช้งานในเมืองจนถึงสปอร์ต",
          },
          {
            title: "วางขายง่ายรวดเร็ว",
            desc: "ประกาศขายได้ในไม่กี่ขั้นตอน พร้อมเครื่องมือช่วยตั้งราคา",
          },
          {
            title: "ปลอดภัย โปร่งใส",
            desc: "ระบบยืนยันตัวตนและประวัติการใช้งาน สบายใจทั้งผู้ซื้อผู้ขาย",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-3xl bg-white shadow-[var(--shadow-md)] p-(--space-m)"
          >
            <h3 className="text-1 bold text-maroon mb-(--space-2xs)">
              {f.title}
            </h3>
            <p className="text--1 text-grey">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
