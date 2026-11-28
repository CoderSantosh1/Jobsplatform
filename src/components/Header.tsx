"use client";

import Link from "next/link";
import FreeTestSeriesMegaMenu from "./FreeTestSeriesMegaMenu";
import { useState } from "react";

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="w-full">
      <header className="bg-[#A92E2E] w-full max-w-7xl mx-auto shadow-md border-b border-gray-300">
        <div className="container mx-auto">
          {/* Top Section with Logo + Hamburger */}
          <div className="flex items-center md:justify-center px-3 py-4 md:py-2">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="text-xs md:text-sm text-gray-200 text-center tracking-wider font-[700] ">
              <Link href="/">WWW.SARKARIRESULTSNOW.COM</Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-wrap justify-center gap-4 py-2">
            <Link
              href="/"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Home
            </Link>
            <FreeTestSeriesMegaMenu />
            <Link
              href="/jobs"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Jobs
            </Link>
            <Link
              href="/results"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Results
            </Link>
            <Link
              href="/admit-cards"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Admit Card
            </Link>
            <Link
              href="/answer-keys"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Answer Key
            </Link>
            <Link
              href="/admissions"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Admissions
            </Link>
            <Link
              href="/contact"
              className="text-[#000000] hover:text-blue-800 font-medium"
            >
              Contact Us
            </Link>
          </nav>

          {/* Mobile Sidebar Navigation */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 flex">
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setMobileNavOpen(false)}
              ></div>

              {/* Sidebar Drawer */}
              <div className="relative  w-[300px] bg-white shadow-lg h-full overflow-y-auto animate-slide-in-left ">
                {/* Menu Icon - now also closes the drawer */}
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded hover:bg-gray-100"
                ></button>

                {/* Links */}
                <nav className="flex flex-col py-2">
                  {/* Close Button */}
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close menu"
                    className="flex justify-end p-2 rounded hover:bg-gray-100"
                  >
                    ✕
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 text-gray-800 font-[600] text-[14px] hover:text-blue-800"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Home
                  </Link>
                  <FreeTestSeriesMegaMenu />
                  <Link
                    href="/jobs"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/results"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Results
                  </Link>
                  <Link
                    href="/admit-cards"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Admit Card
                  </Link>
                  <Link
                    href="/answer-keys"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Answer Key
                  </Link>
                  <Link
                    href="/admissions"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Admissions
                  </Link>
                  <Link
                    href="/contact"
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Contact Us
                  </Link>
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
