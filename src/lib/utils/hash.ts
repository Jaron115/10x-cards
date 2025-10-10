/**
 * Hash utility functions for generating MD5 hashes
 * Used for hashing source_text for generation tracking without storing the actual content
 */

import crypto from "node:crypto";

/**
 * Calculate MD5 hash of a given text string
 * @param text - The text to hash
 * @returns MD5 hash as hexadecimal string
 * @example
 * const hash = calculateMD5("sample text");
 * // Returns: "5e8ff9bf55ba3508199d22e984129be6"
 */
export function calculateMD5(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}
