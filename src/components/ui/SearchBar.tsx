// components/ui/SearchBar.tsx
"use client";

import { useEffect, useState } from "react";

interface SearchBarProps {
  value?: string; // optional now
  onChange: (q: string) => void;
  placeholder?: string;
  delay?: number; // debounce delay in ms
  className?: string;
}

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search...",
  delay = 300,
  className = "",
}: SearchBarProps) {
  const [local, setLocal] = useState<string>(value);

  // keep local in sync if parent changes value
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // debounce effect
  useEffect(() => {
    const id = setTimeout(() => onChange(local.trim()), delay);
    return () => clearTimeout(id);
  }, [local, onChange, delay]);

  return (
    <div className={`flex items-center ${className}`}>
      <input
        aria-label="Search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {local ? (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="px-2 py-2 border-t border-b border-r border-gray-300 rounded-r-md hover:bg-gray-100"
          aria-label="Clear search"
        >
          ×
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChange(local)}
          className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
        >
          Search
        </button>
      )}
    </div>
  );
}
