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
      <h1 className="step-2 font-bold">Buy Cars</h1>

      <p className="mt-(--space-s)">
        Search: <span className="font-bold">{queryText || "(All)"}</span>
      </p>

      {/* TODO: Replace with real results filtered by `queryText` */}
      <div className="mt-(--space-m) rounded-xl border border-grey p-(--space-s)">
        Search results will be displayed here
      </div>
    </div>
  );
}
