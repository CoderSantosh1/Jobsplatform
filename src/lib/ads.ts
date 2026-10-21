// Where Google AdSense and Google Analytics may run. The admin dashboard (and its login page) never shows ads
// and is never counted in analytics, so admin visits don't inflate the site's numbers.
export function isAdFreePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export const GA_MEASUREMENT_ID = "G-8GZPT68Z06";

/** Google's documented opt-out switch: while `window[GA_DISABLE_KEY]` is true, gtag sends nothing. */
export const GA_DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`;

/** Hides AdSense units (manual, auto-placed, anchor and vignette) that were injected before navigating into an ad-free page. */
export const HIDE_ADS_CSS = [
  "ins.adsbygoogle",
  ".google-auto-placed",
  ".adsbygoogle-noablate",
  "iframe[id^='aswift_']",
  "iframe[id^='google_ads_iframe']",
].join(",") + "{display:none!important}";
