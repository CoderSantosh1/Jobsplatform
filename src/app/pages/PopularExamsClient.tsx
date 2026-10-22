"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { testSeriesPath } from "@/lib/slug";
import { cloudinaryThumb } from "@/lib/cloudinary";

export interface Subcategory {
  _id?: string;
  name: string;
  icon?: string;
}

export interface Category {
  _id?: string;
  name: string;
  icon?: string;
  subcategories: Subcategory[];
}

const DEFAULT_ICON = "/file.svg";

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-400">
    <path
      d="M9 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function Img({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const url = !src ? DEFAULT_ICON : src.startsWith("http") || src.startsWith("/") ? cloudinaryThumb(src, 36) : `/${src}`;
  return <img src={url} alt={alt} className={className} loading="lazy" decoding="async" width="36" height="36" />;
}

export default function PopularExamsClient({ categories }: { categories: Category[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const activeCategory = useMemo(() => categories[activeIndex], [categories, activeIndex]);
  const exams = useMemo<Subcategory[]>(
    () => (activeCategory?.subcategories || []).filter((s) => s && typeof s.name === "string"),
    [activeCategory]
  );

  const updateScrollButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeftBtn(el.scrollLeft > 0);
    setShowRightBtn(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const scrollChips = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const chip = el.querySelector("button");
    const scrollAmount = chip ? chip.getBoundingClientRect().width + 16 : 120;
    el.scrollBy({ left: dir === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
    window.setTimeout(updateScrollButtons, 300);
  };

  return (
    <section className="relative px-4 w-full max-w-screen overflow-x-hidden">
      <h2 className="text-2xl font-bold mb-2 text-[#1a124d]">Free Mock Tests for Popular Govt Exams</h2>
      <p className="text-[#1a124d] text-sm sm:text-base mb-4">
        Pick your exam and practise with free timed mock tests based on the latest exam pattern
      </p>

      <div className="relative flex items-center">
        {showLeftBtn && (
          <button
            aria-label="Scroll left"
            onClick={() => scrollChips("left")}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border rounded-full shadow p-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <div
          ref={scrollerRef}
          onScroll={updateScrollButtons}
          className="flex gap-3 hide-scrollbar px-10 whitespace-nowrap overflow-x-auto"
        >
          {categories.map((c, i) => (
            <button
              key={c._id || c.name}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                i === activeIndex ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {showRightBtn && (
          <button
            aria-label="Scroll right"
            onClick={() => scrollChips("right")}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border rounded-full shadow p-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exams.map((exam) => (
          <Link
            key={exam._id || exam.name}
            href={testSeriesPath(activeCategory?.name || "", exam.name)}
            className="group flex items-center justify-between rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <Img src={exam.icon} alt={exam.name} className="w-9 h-9 rounded object-contain bg-white" />
              <span className="font-semibold text-gray-900">{exam.name}</span>
            </div>
            <ChevronRight />
          </Link>
        ))}

        <Link
          href="/quizzes"
          className="flex items-center justify-center rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition text-cyan-700 font-semibold"
        >
          Explore all exams
        </Link>
      </div>
    </section>
  );
}
