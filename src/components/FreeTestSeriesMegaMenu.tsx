"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

const DEFAULT_ICON = "/file.svg";
const RIGHT_ARROW = (
  <svg
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
    className="text-gray-400 group-hover:text-blue-600 transition"
  >
    <path
      d="M7.5 5l5 5-5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function flattenSubcategories(subs: any): Subcategory[] {
  if (!Array.isArray(subs)) return [];
  return subs.reduce((acc: Subcategory[], val) => {
    if (Array.isArray(val)) {
      return acc.concat(flattenSubcategories(val));
    } else if (val && typeof val === "object" && typeof val.name === "string") {
      acc.push(val);
    }
    return acc;
  }, []);
}

function getIconUrl(icon: string | undefined) {
  if (!icon || typeof icon !== "string" || !icon.trim()) return DEFAULT_ICON;
  if (icon.startsWith("http")) return icon;
  if (icon.startsWith("/")) return icon;
  return "/" + icon;
}

const FreeTestSeriesMegaMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(
    null
  ); // category _id or name
  const scrollRef = useRef<HTMLDivElement>(null);

  // reset scroll to top when menu opens
  useEffect(() => {
    if (mobileSidebarOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [mobileSidebarOpen]);
  useEffect(() => {
    if (open || mobileSidebarOpen) {
      setLoading(true);
      fetch("/api/quiz-categories")
        .then((res) => res.json())
        .then((data) => setCategories(data))
        .finally(() => setLoading(false));
    }
  }, [open, mobileSidebarOpen]);

  useEffect(() => {
    if (
      (open || mobileSidebarOpen) &&
      categories.length > 0 &&
      !selectedCategory
    ) {
      setSelectedCategory(categories[0]);
    }
  }, [open, mobileSidebarOpen, categories, selectedCategory]);

  // Responsive: show as mega menu on desktop, drawer on mobile
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setSelectedCategory(null);
      }}
    >
      {/* Desktop trigger */}
      <Link
        href="/quizzes"
        className="text-[#000000] hover:text-blue-800 font-medium px-4  hidden md:inline"
      >
        Test Series
      </Link>
      {/* Mobile trigger */}
      <button
        className="md:hidden text-[#000000] hover:text-blue-800 font-[700] text-[16px] px-4 py-2 flex items-center gap-2"
        aria-label="Open Free Test Series menu"
      >
        Test Series
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Desktop Mega Menu */}
      {open && (
        <div
          className="absolute hidden md:flex z-50 w-[930px] bg-white border rounded-lg shadow-xl p-0 flex-row animate-fade-in min-h-[300px]"
          role="menu"
          aria-label="Free Test Series Mega Menu"
        >
          {/* Sidebar */}
          <div className="w-[250px] bg-gray-50 border-r rounded-l-lg flex flex-col py-4 gap-2 shadow-sm px-2 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="text-center text-black-400 py-4">
                No categories found.
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat._id || cat.name}
                  className={`flex items-center gap-4 px-5 py-3 w-full text-left rounded-lg transition focus:outline-none group
              ${
                selectedCategory?._id === cat._id ||
                selectedCategory?.name === cat.name
                  ? "bg-blue-50 shadow-md font-semibold text-blue-800 ring-2 ring-blue-200"
                  : "bg-white text-gray-800 hover:bg-blue-50 hover:shadow"
              }`}
                  onMouseEnter={() => setSelectedCategory(cat)}
                  onFocus={() => setSelectedCategory(cat)}
                  tabIndex={0}
                  aria-selected={
                    selectedCategory?._id === cat._id ||
                    selectedCategory?.name === cat.name
                  }
                >
                  <img
                    src={getIconUrl(cat.icon)}
                    alt={typeof cat.name === "string" ? cat.name : ""}
                    className={`w-5 h-5 object-contain rounded bg-white ${
                      selectedCategory?._id === cat._id ||
                      selectedCategory?.name === cat.name
                        ? "ring-2 ring-blue-300"
                        : ""
                    }`}
                  />
                  <span className="text-[14px] font-[600]">{cat.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Grid Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
            {selectedCategory ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={getIconUrl(selectedCategory.icon)}
                    alt={selectedCategory.name}
                    className="w-6 h-6 object-contain rounded shadow bg-white"
                  />
                  <span className="text-lg font-bold text-gray-800">
                    {selectedCategory.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {flattenSubcategories(selectedCategory.subcategories).map(
                    (sub) => (
                      <Link
                        key={sub._id || sub.name}
                        href={`/quizzes?category=${encodeURIComponent(
                          selectedCategory.name
                        )}&subcategory=${encodeURIComponent(sub.name)}`}
                        className="flex items-center gap-3 bg-white text-[4px] hover:bg-blue-50 border rounded-lg p-2 shadow transition min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <img
                          src={getIconUrl(sub.icon)}
                          alt={sub.name}
                          className="w-5 h-5 object-contain rounded bg-white"
                        />
                        <span className="flex-1 text-[10px] font-[500] text-black-700 ">
                          {sub.name}
                        </span>
                        {RIGHT_ARROW}
                      </Link>
                    )
                  )}
                  {flattenSubcategories(selectedCategory.subcategories)
                    .length === 0 && (
                    <div className="text-black-500 italic col-span-full text-center py-6">
                      No exams found in this category.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 italic flex items-center justify-center h-full">
                Select a category to view exams.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer/Menu */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
          ></div>

          {/* Drawer */}
          <div className="relative  bg-white border-r shadow-xl flex flex-col h-full animate-slide-in-left">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-bold text-lg">Categories</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            {/* Scrollable Categories */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No categories found.
                </div>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat._id || cat.name}
                    className={`flex items-center gap-4 px-5 py-3  w-full text-left rounded-lg transition focus:outline-none
                ${
                  selectedCategory?._id === cat._id ||
                  selectedCategory?.name === cat.name
                    ? "bg-blue-50 shadow-md font-semibold text-blue-800 ring-2 ring-blue-200"
                    : "bg-white text-gray-800 hover:bg-blue-50 hover:shadow"
                }`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setMobileSidebarOpen(false);
                    }}
                    tabIndex={0}
                  >
                    <img
                      src={getIconUrl(cat.icon)}
                      alt={typeof cat.name === "string" ? cat.name : ""}
                      className="w-4 h-4 object-contain rounded bg-white"
                    />
                    <span className="truncate text-[7px] font-[600]">
                      {cat.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Subcategory Grid (accordion style, one open at a time) */}
      <div className="md:hidden w-full px-2 pt-2 ref={scrollRef}">
        {categories.map((cat) => {
          const isOpen = openMobileCategory === (cat._id || cat.name);
          return (
            <div key={cat._id || cat.name} className="mb-4">
              <button
                className={`flex items-center gap-4 w-full text-left py-3 px-2 rounded-lg transition focus:outline-none ${
                  isOpen
                    ? "bg-blue-50 shadow font-semibold text-blue-800 ring-2 ring-blue-200"
                    : "bg-white text-gray-800 hover:bg-blue-50 hover:shadow-md"
                }`}
                onClick={() =>
                  setOpenMobileCategory(isOpen ? null : cat._id || cat.name)
                }
                aria-expanded={isOpen}
                aria-controls={`mobile-cat-panel-${cat._id || cat.name}`}
                type="button"
              >
                <img
                  src={getIconUrl(cat.icon)}
                  alt={typeof cat.name === "string" ? cat.name : ""}
                  className="w-8 h-8 object-contain rounded bg-white"
                />
                <span className="text-[10px] font-[600] flex-1">
                  {typeof cat.name === "string" ? cat.name : "[Invalid name]"}
                </span>
                <svg
                  className={`w-5 h-5 ml-2 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isOpen && (
                <div
                  id={`mobile-cat-panel-${cat._id || cat.name}`}
                  className="mt-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {flattenSubcategories(cat.subcategories).map((sub) => (
                      <Link
                        key={sub._id || sub.name}
                        href={`/quizzes?category=${encodeURIComponent(
                          typeof cat.name === "string" ? cat.name : ""
                        )}&subcategory=${encodeURIComponent(sub.name)}`}
                        className="flex items-center bg-white hover:bg-blue-50 border border-gray-200 rounded-xl shadow p-1 gap-3 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                        tabIndex={0}
                      >
                        <img
                          src={getIconUrl(sub.icon)}
                          alt={sub.name}
                          className="w-7 h-7 object-contain rounded bg-white"
                        />
                        <span className="text-[5px] font-[500] text-black-700">
                          {sub.name}
                        </span>
                        <span className="ml-2">{RIGHT_ARROW}</span>
                      </Link>
                    ))}
                    {flattenSubcategories(cat.subcategories).length === 0 && (
                      <div className="text-gray-400 italic col-span-full text-center py-4">
                        No exams found in this category.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FreeTestSeriesMegaMenu;
