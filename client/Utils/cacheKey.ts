// src/Utils/cacheKey.ts
/**
 * Turns any string into a SecureStore-compatible key.
 * Allowed: a-z A-Z 0-9 . _ -
 * Empty → returns null (caller must handle)
 */
export const makeSecureKey = (input: string): string | null => {
  if (!input) return null;
  const safe = input
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')   // replace illegal chars with _
    .replace(/_+/g, '_')               // collapse multiple _
    .toLowerCase();

  return safe || null;
};