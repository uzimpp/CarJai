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
  placeholder = "city car...",
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

  function handleClear() {
    setQueryText("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full max-w-[567px] ${className ?? ""}`}
    >
      <div className="flex flex-row w-full rounded-full bg-white items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={placeholder}
            className="w-full flex rounded-l-full px-(--space-s) py-(--space-2xs) pr-(--space-xl) text-maroon focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-(--space-2xs) top-1/2 -translate-y-1/2 p-(--space-3xs) text-maroon/60 hover:text-maroon transition-colors focus:outline-none"
              aria-label="Clear search"
            >
              <svg
                className="w-(--space-s) h-(--space-s)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="rounded-r-full">
          <button
            type="submit"
            className="rounded-full m-(--space-3xs) px-(--space-2xs) py-(--space-2xs) bg-maroon/20 text-maroon bold transition-colors hover:bg-maroon/30 focus:outline-none"
            aria-label="Search"
          >
            <svg
              className="w-(--space-s) h-(--space-s)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
