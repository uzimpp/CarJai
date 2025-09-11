"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
  actionPath?: string; // default "/buy"
};

export default function SearchBar({
  className,
  placeholder = "ค้นหารถ...",
  actionPath = "/buy",
}: SearchBarProps) {
  const router = useRouter();
  const [queryText, setQueryText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = queryText.trim();
    const url = trimmed
      ? `${actionPath}?q=${encodeURIComponent(trimmed)}`
      : actionPath;
    router.push(url);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full max-w-[567px] ${className ?? ""}`}
    >
      <div className="flex flex-row w-full rounded-full">
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={placeholder}
          className="w-full flex rounded-l-full px-(--space-s) py-(--space-2xs) bg-white text-maroon focus:outline-none"
        />
        <div className="rounded-r-full bg-white">
          <button
            type="submit"
            className="rounded-full px-(--space-s) py-(--space-2xs) bg-maroon/20 text-maroon bold transition-colors"
          >
            ค้นหา
          </button>
        </div>
      </div>
    </form>
  );
}
