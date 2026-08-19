/**
 * Production environment validation.
 * Validates required env vars at startup. Throws in production if any are
 * missing or set to known placeholder values.
 */

const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
] as const;

const KNOWN_PLACEHOLDERS = new Set([
  "change-this-secret-in-production-minimum-32-chars",
  "REPLACE_ME_use_openssl_rand_-base64_32",
  "REPLACE_ME_your_api_key_here",
]);

export function validateEnv(): void {
  // Skip during Next.js build phase — env vars are not available at build time
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      errors.push(`${key} is not set`);
    } else if (KNOWN_PLACEHOLDERS.has(value)) {
      errors.push(`${key} is set to a placeholder value — replace it before deploying`);
    }
  }

  if (errors.length === 0) return;

  const message = `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`;

  if (isProduction) {
    throw new Error(message);
  } else {
    console.warn(`[env] WARNING: ${message}`);
  }
}
