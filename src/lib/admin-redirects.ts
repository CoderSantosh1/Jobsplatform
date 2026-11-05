// The redirects that are live today, read from next.config.js, for the admin Redirect Manager (read-only).
import nextConfig from "../../next.config.js";
import type { RedirectRule } from "@/lib/admin-seo-checks";

type ConfigRedirect = { source: string; destination: string; permanent?: boolean; has?: unknown[] };

export async function configRedirectList(): Promise<(ConfigRedirect & { conditional: boolean })[]> {
  const list = ((await (nextConfig as { redirects?: () => Promise<ConfigRedirect[]> }).redirects?.()) ?? []) as ConfigRedirect[];
  return list.map((r) => ({ ...r, conditional: Array.isArray(r.has) && r.has.length > 0 }));
}

/** Simple path-to-path redirects (host-based and pattern rules are left out of chain checks). */
export async function configRedirects(): Promise<RedirectRule[]> {
  return (await configRedirectList())
    .filter((r) => !r.conditional && !r.source.includes(":") && r.destination.startsWith("/"))
    .map((r) => ({ from: r.source, to: r.destination }));
}
