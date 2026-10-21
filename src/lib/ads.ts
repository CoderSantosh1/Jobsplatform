// Where Google AdSense may run. The admin dashboard (and its login page) never loads or shows ads.
export function isAdFreePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Hides AdSense units (manual, auto-placed, anchor and vignette) that were injected before navigating into an ad-free page. */
export const HIDE_ADS_CSS = [
  "ins.adsbygoogle",
  ".google-auto-placed",
  ".adsbygoogle-noablate",
  "iframe[id^='aswift_']",
  "iframe[id^='google_ads_iframe']",
].join(",") + "{display:none!important}";
