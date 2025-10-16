"use client";

export default function AdBanner() {
  return (
    <div className="flex justify-center my-4">
      <a
        href="https://your-adsterra-referral-link.com"
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <img
          src="https://landings-cdn.adsterratech.com/referralBanners/png/728%20x%2090%20px.png"
          alt="banner"
          className="w-[728px] max-w-full h-auto"
          loading="lazy"
        />
      </a>
    </div>
  );
}
