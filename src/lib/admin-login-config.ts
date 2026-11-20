export type AdminLoginConfig = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
};

const REQUIRED_ADMIN_LOGIN_CONFIG = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "JWT_SECRET"] as const;

/** Read only when handling a request so OpenNext has time to populate Worker bindings. */
export function getAdminLoginConfig(
  env: AdminLoginConfig = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
  },
): AdminLoginConfig {
  return {
    ADMIN_EMAIL: env.ADMIN_EMAIL,
    ADMIN_PASSWORD: env.ADMIN_PASSWORD,
    JWT_SECRET: env.JWT_SECRET,
  };
}

/** Prefer request-scoped Cloudflare bindings; process.env is for local Next.js runs. */
export function resolveAdminLoginConfig(
  workerEnv: AdminLoginConfig,
  processEnv: Record<string, string | undefined>,
): AdminLoginConfig {
  return getAdminLoginConfig({
    ADMIN_EMAIL: workerEnv.ADMIN_EMAIL ?? processEnv.ADMIN_EMAIL,
    ADMIN_PASSWORD: workerEnv.ADMIN_PASSWORD ?? processEnv.ADMIN_PASSWORD,
    JWT_SECRET: workerEnv.JWT_SECRET ?? processEnv.JWT_SECRET,
  });
}

/** Return missing variable names only; never include credential values in diagnostics. */
export function getMissingAdminLoginConfig(config: AdminLoginConfig): string[] {
  return REQUIRED_ADMIN_LOGIN_CONFIG.filter((name) => !config[name]);
}
