type BuyPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function BuyPage({ searchParams }: BuyPageProps) {
  const { q } = await searchParams;
  const queryText = (q ?? "").toString();

  return (
    <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto w-full">
      <h1 className="step-2 font-bold">ซื้อรถ</h1>

      <p className="mt-(--space-s)">
        คำค้นหา: <span className="font-bold">{queryText || "(ทั้งหมด)"}</span>
      </p>

      {/* TODO: Replace with real results filtered by `queryText` */}
      <div className="mt-(--space-m) rounded-xl border border-grey p-(--space-s)">
        แสดงผลลัพธ์การค้นหาที่นี่
      </div>
    </div>
  );
}
