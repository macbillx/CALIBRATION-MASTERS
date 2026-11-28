import { createHash } from "node:crypto";

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function validatePassword(value: unknown) {
  if (typeof value !== "string" || value.length < 12) return "Password must be at least 12 characters.";
  if (Buffer.byteLength(value, "utf8") > 72) return "Password must be no more than 72 bytes.";
  return null;
}

export function digestToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
