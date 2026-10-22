import Link from "next/link";
import Image from "next/image";
import { EXAMS } from "@/lib/exams";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 ">
      <div className="container mx-auto px-4 py-6">
        {/* Footer Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-6">
          <div >
            <h3 className="text-lg font-bold text-red-700 mb-3 ">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Latest Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Results
                </Link>
              </li>
              <li>
                <Link
                  href="/admit-cards"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Admit Card
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/answer-keys"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Answer Key
                </Link>
              </li>
              <li>
                <Link
                  href="/admissions"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Admissions
                </Link>
              </li>
              <li>
                <Link
                  href="/quizzes"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Free Mock Tests
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div className="">
            <h3 className="md:text-[20px] text-[12px] font-bold text-red-700 mb-3 ">
              Contact Information
            </h3>
            <p className="text-gray-700 mb-2 hover:text-blue-900  ">
              <a href="mailto:support@sarkariresultsnow.com">
                support@sarkariresultsnow.com
              </a>
            </p>

            <div className="flex space-x-6">
              <a
                href="https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
                className="text-blue-600 hover:text-blue-800"
              >
                <Image
                  src="/whatspp.png"
                  alt="Whatsapp"
                  width={24}
                  height={24}
                />
              </a>
              <a
                href="https://t.me/+edSF3XKgzRU0MTY1"
                className="text-blue-600 hover:text-blue-800"
              >
                <Image
                  src="/telegram.png"
                  alt="Telegram"
                  width={24}
                  height={24}
                />
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                <Image
                  src="/facebook.png"
                  alt="Facebook"
                  width={24}
                  height={24}
                />
              </a>
              <a
                href="https://www.instagram.com/sarkariresultsnow/"
                className="text-blue-600 hover:text-blue-800"
              >
                <Image
                  src="/insta.png"
                  alt="Instagram"
                  width={24}
                  height={24}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Popular exam landing pages */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-lg font-bold text-red-700 mb-2 text-center">Popular Exams</h3>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            {EXAMS.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className="text-blue-600 hover:text-blue-800">
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm text-gray-600 text-center">
            Sarkari Results Now is an independent information portal and is not
            affiliated with any government organisation. Always verify details on
            the official website before applying.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm mb-3">
            <Link href="/about" className="text-blue-600 hover:text-blue-800">About Us</Link>
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
            <Link href="/disclaimer" className="text-blue-600 hover:text-blue-800">Disclaimer</Link>
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms &amp; Conditions</Link>
            <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Us</Link>
          </nav>
          <p className="text-xl font-bold text-red-700 mb-1">
            SarkariResultsNow.com
          </p>
          <p className="text-sm text-gray-600 mt-2">
            &copy; {new Date().getFullYear()} SarkariResultsNow.com. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
