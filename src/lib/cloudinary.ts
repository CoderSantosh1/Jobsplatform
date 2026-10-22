// Ask Cloudinary for a small, optimised copy of an uploaded image instead of the full-size original.

/**
 * Adds a resize + auto format/quality transformation to a Cloudinary upload URL. `size` is the displayed size in
 * CSS pixels; the image is fetched at 2x for sharp rendering on high-density screens. Other URLs are returned as is.
 */
export function cloudinaryThumb(url: string, size: number): string {
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || at < 0) return url;
  const rest = url.slice(at + marker.length);
  if (/^[a-z]{1,3}_[^/]*\//.test(rest) && !/^v\d+\//.test(rest)) return url; // already transformed
  const px = Math.round(size * 2);
  return `${url.slice(0, at + marker.length)}f_auto,q_auto,c_fit,w_${px},h_${px}/${rest}`;
}
