/**
 * Sanitizer utility — strips HTML/XML tags from string inputs
 * to prevent stored XSS (Cross-Site Scripting) attacks.
 *
 * This is a defense-in-depth measure. React JSX already escapes
 * HTML by default, but this ensures data stored in the database
 * is clean even if consumed by non-React clients.
 *
 * Strategy: REMOVE HTML tags entirely (not encode them).
 * This avoids double-encoding issues with React and keeps data clean.
 */

/**
 * Remove HTML/XML tags and dangerous content from a string.
 * - Strips <script>, <iframe>, <img onerror>, <a href="javascript:">, etc.
 * - Removes event handlers (onclick=, onerror=, etc.)
 * - Removes javascript: URIs
 * - Leaves only clean text content
 */
export function sanitizeString(input: string): string {
  let cleaned = input;

  // ── Step 1: Decode common HTML entities first ───────────────
  // This prevents encoded attacks like &lt;script&gt; from bypassing the tag stripper
  cleaned = cleaned
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x27;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');

  // ── Step 2: Remove dangerous tags and their content ─────────
  cleaned = cleaned
    // Remove script blocks and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style blocks and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove iframe, object, embed blocks and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove svg, math (can contain XSS payloads)
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, '');

  // ── Step 3: Remove all remaining HTML tags ──────────────────
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // ── Step 4: Remove dangerous URI schemes ────────────────────
  cleaned = cleaned
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:')
    .replace(/vbscript\s*:/gi, 'blocked:');

  // ── Step 5: Remove event handler attributes ────────────────
  cleaned = cleaned.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  return cleaned.trim();
}

/**
 * Recursively sanitize all string values in an object.
 * Handles nested objects, arrays, and primitive values.
 */
export function sanitizeObject<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeString(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as T;
  }

  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return input;
}
