import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        {/* Footer Navigation */}
        {/* mobile: 2 columns (centered). md+: 3 columns (left-aligned) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-6 text-center md:text-left items-start px-8 py-8">
          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold text-red-600 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/latest-jobs"
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
                  href="/admit-card"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Admit Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold text-red-600 mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/answer-key"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Answer Key
                </Link>
              </li>
              <li>
                <Link
                  href="/syllabus"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Syllabus
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Search
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Social */}
          {/* On mobile: span full width (col-span-2) and centered; on md+: normal 3rd column */}
          <div className="flex flex-col items-center md:items-start col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-red-600 mb-3">
              Contact Information
            </h3>

            <p className="text-gray-700 mb-2 text-sm">
              Email:{" "}
              <a
                href="mailto:sarkariresultsnow@zohomail.in"
                className="text-blue-600 hover:text-blue-800 break-all"
                aria-label="Email support at sarkariresultsnow"
              >
                sarkariresultsnow@zohomail.in
              </a>
            </p>

            <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
              <a
                href="https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Whatsapp"
                className="inline-flex items-center p-1 rounded hover:scale-105 transition-transform"
              >
                <Image
                  src="/whatspp.png"
                  alt="WhatsApp"
                  width={28}
                  height={28}
                />
              </a>

              <a
                href="https://t.me/+edSF3XKgzRU0MTY1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Telegram"
                className="inline-flex items-center p-1 rounded hover:scale-105 transition-transform"
              >
                <Image
                  src="/telegram.png"
                  alt="Telegram"
                  width={28}
                  height={28}
                />
              </a>

              <a
                href="facebook.com"
                aria-label="Facebook (opens in new tab)"
                className="inline-flex items-center p-1 rounded opacity-90 hover:opacity-100 hover:scale-105 transition"
              >
                <Image
                  src="/facebook.png"
                  alt="Facebook"
                  width={28}
                  height={28}
                />
              </a>

              <a
                href="https://www.instagram.com/sarkariresultsnow/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center p-1 rounded hover:scale-105 transition-transform"
              >
                <Image
                  src="/insta.png"
                  alt="Instagram"
                  width={28}
                  height={28}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm text-gray-600 text-center">
            Provide the best jobs and results, admitCard, Jobslatestnews,
            university result for students. We do not endorse any particular job
            or result.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-1">
            Sarkariresultsnow
          </h2>
          <p className="text-sm text-gray-600">WWW.sarkariresultsnow.COM</p>
          <p className="text-sm text-gray-600 mt-2">
            &copy; {new Date().getFullYear()} Sarkariresultsnow. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
