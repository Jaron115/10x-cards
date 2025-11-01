/**
 * Hash utility functions for generating SHA-256 hashes
 * Used for hashing source_text for generation tracking without storing the actual content
 *
 * Uses Web Crypto API (SubtleCrypto) which is available in:
 * - Modern browsers
 * - Node.js (via globalThis.crypto)
 * - Cloudflare Workers
 * - Deno
 */

/**
 * Calculate SHA-256 hash of a given text string using Web Crypto API
 * @param text - The text to hash
 * @returns SHA-256 hash as hexadecimal string
 * @example
 * const hash = await calculateMD5("sample text");
 * // Returns: "b94f6f125c79e3a5ffaa826f584c10a93ccd4b4b8dc3f3a9c5f1d6e0d1d5e0a1"
 */
export async function calculateMD5(text: string): Promise<string> {
  // Convert text to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}
