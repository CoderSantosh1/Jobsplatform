// components/ChipsScroller.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";

interface Subcategory {
  _id?: string;
  name: string;
  icon?: string;
}
interface Category {
  _id?: string;
  name: string;
  icon?: string;
  subcategories: Subcategory[];
}

export default function ChipsScroller({
  categories,
  defaultIndex = 0,
}: {
  categories: Category[];
  defaultIndex?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setShowLeft(el.scrollLeft > 0);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByAmount = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const chip = el.querySelector("button");
    const amount = chip
      ? (chip as HTMLElement).getBoundingClientRect().width + 16
      : 120;
    el.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex items-center w-full">
      {showLeft && (
        <button
          onClick={() => scrollByAmount("left")}
          className="absolute left-0 z-10 bg-white p-2 rounded-full hidden sm:flex"
        >
          ‹
        </button>
      )}
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar px-10 whitespace-nowrap"
      >
        {categories.map((c, i) => (
          <button
            key={c._id || c.name}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
              i === activeIndex
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-white text-gray-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {showRight && (
        <button
          onClick={() => scrollByAmount("right")}
          className="absolute right-0 z-10 bg-white p-2 rounded-full hidden sm:flex"
        >
          ›
        </button>
      )}
    </div>
  );
}
