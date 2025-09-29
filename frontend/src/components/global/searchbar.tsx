"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
  actionPath?: string;
};

export default function SearchBar({
  className = "",
  placeholder = "Search cars...",
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
    <div className="flex w-full justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className={`flex flex-row w-full rounded-full max-w-[567px] items-center bg-white ${className}`}
      >
        <div className="flex items-center rounded-r-full">
          <button
            type="submit"
            className="rounded-full mx-(--space-2xs) px-(--space-3xs) py-(--space-3xs) text-maroon bold transition-colors hover:bg-maroon/20 focus:outline-none"
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
        <div className="relative w-full">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={placeholder}
            className="w-full flex my-(--space-2xs) text-maroon focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full absolute right-(--space-2xs) top-1/2 -translate-y-1/2 p-(--space-3xs) text-maroon/80 bg-maroon/20 hover:text-white hover:bg-maroon/70 transition-colors focus:outline-none"
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
      </form>
    </div>
  );
}
