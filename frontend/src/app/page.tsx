import SearchBar from "@/components/global/searchbar";

export default function Home() {
  return (
    <div
      className="!pb-(--space-l) px-(--space-m) py-(--space-s) gap-y-(--space-2xl-4xl)
    max-w-[1536px] mx-auto w-full flex justify-between flex-row items-center"
    >
      <div className="flex flex-col items-center justify-center gap-y-(--space-s) bg-red w-full h-[calc(var(--space-5xl)*2)] rounded-4xl">
        <h1 className="text-5 letter-spacing-6 bold text-white">
          หารถโดนใจได้ที่คาร์ใจ
        </h1>
        <SearchBar />
      </div>
    </div>
  );
}
