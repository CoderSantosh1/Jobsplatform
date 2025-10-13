import React from "react";

function iconsocialmedia() {
  return (
    <div className="bg-[#FFF] w-full flex items-center justify-center gap-3 mb-4 mt-4">
      {/* WhatsApp — Ripple Glow */}
      <a
        href="https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
        target="_blank"
        rel="noopener noreferrer"
        className="relative overflow-hidden px-5 py-2 bg-green-500 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-green-600 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-green-300 animate-glow"
      >
        {/* ripple rings */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute w-40 h-40 rounded-full bg-white/25 blur-sm animate-ripple" />
          <span className="absolute w-40 h-40 rounded-full bg-white/20 blur-sm animate-ripple-delay" />
        </span>

        {/* icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-4 h-4 relative"
        >
          <path d="M12 0C5.371 0 0 5.373 0 12c0 2.115.55 4.105 1.516 5.83L0 24l6.387-1.672A11.95 11.95 0 0 0 12 24c6.629 0 12-5.373 12-12S18.629 0 12 0zm0 21.818c-1.835 0-3.587-.481-5.143-1.394l-.368-.213-3.789 1.003 1.011-3.692-.239-.379A9.78 9.78 0 0 1 2.182 12C2.182 6.486 6.486 2.182 12 2.182S21.818 6.486 21.818 12 17.514 21.818 12 21.818zm5.207-7.297c-.284-.141-1.681-.829-1.942-.922-.26-.093-.45-.141-.639.142-.189.284-.732.922-.897 1.11-.165.189-.332.213-.616.071-.284-.142-1.197-.441-2.282-1.404-.843-.752-1.41-1.68-1.574-1.964-.165-.284-.018-.438.124-.579.127-.126.284-.332.426-.496.142-.165.189-.284.284-.474.094-.189.047-.355-.024-.497-.071-.142-.639-1.541-.875-2.111-.23-.553-.465-.479-.639-.487l-.544-.009c-.189 0-.497.071-.758.355-.26.284-.997.975-.997 2.379s1.022 2.759 1.164 2.948c.142.189 2.009 3.071 4.873 4.306.681.293 1.213.467 1.628.598.684.218 1.305.187 1.796.113.548-.081 1.681-.686 1.918-1.348.236-.662.236-1.229.165-1.348-.071-.118-.26-.189-.544-.33z" />
        </svg>
        <span className="relative font-[600] text-[14px]">Join WhatsApp</span>
      </a>

      {/* Telegram — Comet Shimmer */}
      <a
        href="https://t.me/sarkariresultsnow"
        target="_blank"
        rel="noopener noreferrer"
        className="relative overflow-hidden px-5 py-2 bg-blue-500 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-blue-600 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-blue-300 animate-glow"
      >
        {/* comet sweep */}
        <span
          className="pointer-events-none absolute top-0 left-0 h-full w-[55%] bg-white/25 blur-[2px]
                     -skew-x-12 -translate-x-full animate-comet"
        />
        {/* subtle inner shine */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />

        {/* icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-5 h-5 relative"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.29 3.438 9.747 8.205 11.385.6.111.82-.26.82-.577v-2.23c-3.338.726-4.033-1.416-4.033-1.416-.546-1.389-1.334-1.759-1.334-1.759-1.091-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.836 2.809 1.306 3.495.999.108-.774.419-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.931 0-1.312.469-2.381 1.237-3.221-.124-.304-.536-1.524.116-3.176 0 0 1.008-.322 3.301 1.23A11.52 11.52 0 0 1 12 6.844c1.02.004 2.046.138 3.003.404 2.291-1.552 3.298-1.23 3.298-1.23.653 1.652.241 2.872.118 3.176.77.84 1.236 1.909 1.236 3.221 0 4.61-2.805 5.625-5.478 5.922.43.37.823 1.102.823 2.222v3.293c0 .32.217.694.826.576C20.565 21.744 24 17.288 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="relative font-[600] text-[14px]">Join Telegram</span>
      </a>
    </div>
  );
}

export default iconsocialmedia;
