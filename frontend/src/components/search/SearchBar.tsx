"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { carsAPI } from "@/lib/carsAPI";
import SearchInputField from "./SearchInputField";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
  actionPath?: string;
};

const SEARCH_HISTORY_KEY = "carjai_search_history";
const MAX_HISTORY_ITEMS = 5;

export default function SearchBar({
  className = "",
  placeholder = "Search cars...",
  actionPath = "/browse",
}: SearchBarProps) {
  const router = useRouter();
  const [queryText, setQueryText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        try {
          const history = JSON.parse(stored) as string[];
          setSearchHistory(history.slice(0, MAX_HISTORY_ITEMS));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      if (typeof window !== "undefined") {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Fetch search suggestions (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!queryText.trim()) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Fetch suggestions from API (limit to 5 for quick results)
        const result = await carsAPI.search({ q: queryText.trim(), limit: 5 });
        if (result.success && result.data.cars.length > 0) {
          // Extract unique car titles/brands as suggestions
          const carSuggestions = result.data.cars
            .map((car) => {
              // Build search suggestion from car data
              const parts: string[] = [];
              if (car.brandName) parts.push(car.brandName);
              if (car.modelName) parts.push(car.modelName);
              if (car.submodelName) parts.push(car.submodelName);
              return parts.join(" ");
            })
            .filter((s) => s.trim().length > 0)
            .filter((s, index, self) => self.indexOf(s) === index) // Remove duplicates
            .slice(0, 5);
          setSuggestions(carSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [queryText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allItems = [...searchHistory, ...suggestions];
    const filteredItems = allItems.filter(
      (item, index, self) =>
        self.findIndex((i) => i.toLowerCase() === item.toLowerCase()) === index
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev
      );
      setShowDropdown(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        handleSearch(selected);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      saveToHistory(trimmed);
      setQueryText(trimmed);
      setShowDropdown(false);
      setSelectedIndex(-1);
      const url = `${actionPath}?q=${encodeURIComponent(trimmed)}`;
      router.push(url);
    }
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSearch(queryText);
  }

  const handleHistoryClick = (item: string) => {
    handleSearch(item);
  };

  const handleSuggestionClick = (item: string) => {
    handleSearch(item);
  };

  const handleDeleteHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((i) => i !== item);
      if (typeof window !== "undefined") {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Filter items to show
  const filteredHistory = searchHistory.filter(
    (item) =>
      !queryText.trim() || item.toLowerCase().includes(queryText.toLowerCase())
  );
  const filteredSuggestions = suggestions.filter(
    (item) =>
      item.toLowerCase().includes(queryText.toLowerCase()) &&
      !searchHistory.some((h) => h.toLowerCase() === item.toLowerCase())
  );

  const hasResults =
    filteredHistory.length > 0 || filteredSuggestions.length > 0;
  const showDropdownContent =
    showDropdown && (queryText.trim() || searchHistory.length > 0);

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-md ${className}`}>
      <form onSubmit={handleSubmit}>
        <SearchInputField
          ref={inputRef}
          value={queryText}
          onChange={(value) => {
            setQueryText(value);
            setShowDropdown(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          inputClassName="text-maroon"
        />
      </form>

      {/* Dropdown */}
      {showDropdownContent && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="overflow-y-auto max-h-96">
            {/* Search History */}
            {filteredHistory.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                {filteredHistory.map((item, index) => (
                  <button
                    key={`history-${index}`}
                    type="button"
                    onClick={() => handleHistoryClick(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedIndex === index
                        ? "bg-maroon/10 text-maroon"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="truncate text-sm">{item}</span>
                    </div>
                    <div
                      onClick={(e) => handleDeleteHistory(e, item)}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer"
                      aria-label="Delete from history"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteHistory(
                            e as unknown as React.MouseEvent,
                            item
                          );
                        }
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {filteredSuggestions.map((item, index) => {
                  const globalIndex = filteredHistory.length + index;
                  return (
                    <button
                      key={`suggestion-${index}`}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex
                          ? "bg-maroon/10 text-maroon"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <span className="truncate text-sm">{item}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading State */}
            {isLoadingSuggestions && queryText.trim() && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Searching...</span>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoadingSuggestions && !hasResults && queryText.trim() && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
