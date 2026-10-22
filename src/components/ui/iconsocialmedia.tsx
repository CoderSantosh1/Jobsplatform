import React from "react";

function iconsocialmedia() {
  return (
    <div className="bg-[#FFF] w-full flex items-center justify-center gap-3 mb-4 mt-4">
      {/* WhatsApp — Ripple Glow */}
      <a
        href="https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
        target="_blank"
        rel="noopener noreferrer"
        className="relative overflow-hidden px-5 py-2 bg-green-800 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-green-900 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-green-300"
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
        className="relative overflow-hidden px-5 py-2 bg-blue-800 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-blue-900 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-blue-300"
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
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
        <span className="relative font-[600] text-[14px]">Join Telegram</span>
      </a>
    </div>
  );
}

export default iconsocialmedia;
