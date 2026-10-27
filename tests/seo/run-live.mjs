// Runs the live SEO checks against production from any shell (PowerShell, cmd, bash):
//   pnpm test:seo:live
// Override defaults with the usual env vars if needed (BASE_URL, SAMPLE, CHECK_DOMAIN).
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  BASE_URL: process.env.BASE_URL || "https://www.sarkariresultsnow.com",
  SAMPLE: process.env.SAMPLE || "20",
  CHECK_DOMAIN: process.env.CHECK_DOMAIN || "1",
};

console.log(`Checking ${env.BASE_URL} (SAMPLE=${env.SAMPLE}, CHECK_DOMAIN=${env.CHECK_DOMAIN})\n`);
const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "tests/seo/live-seo.test.mjs"], {
  env,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
