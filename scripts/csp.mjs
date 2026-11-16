// Builds Plumb's Content-Security-Policy at build time. Plain JavaScript so the post-build script
// (scripts/csp-headers.mjs) runs on any Node, with or without TypeScript support.
import { createHash } from "node:crypto";

/**
 * What the page may load. Everything is same-origin; nothing may be sent anywhere else.
 * - `media-src blob:` is required: earbud controls play a silent blob: audio loop.
 * - `connect-src 'self'` stops scripts from posting data to any other origin.
 * A CSP can't stop the user following a link out, or the browser's own speech services.
 */
/** @type {[string, string][]} */
export const CSP_DIRECTIVES = [
  ["default-src", "'none'"],
  ["script-src", "'self'"],
  ["style-src", "'self'"],
  ["font-src", "'self'"],
  ["img-src", "'self' data: blob:"],
  ["media-src", "blob:"],
  ["connect-src", "'self'"],
  ["manifest-src", "'self'"],
  ["worker-src", "'self'"],
  ["form-action", "'none'"],
  ["base-uri", "'none'"],
  ["object-src", "'none'"],
  ["frame-ancestors", "'none'"],
];

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * The script text as the browser's HTML parser hands it to CSP: line endings normalised to LF
 * and NUL replaced by U+FFFD. TanStack's dehydration script contains a literal NUL, so hashing
 * the raw bytes gives a hash the browser never matches and the app fails to start.
 * @param {string} text
 * @returns {string}
 */
export function asParsed(text) {
  return text.replace(/\r\n?/g, "\n").replaceAll("\u0000", "\uFFFD");
}

/**
 * sha256 source expressions for every inline <script> in `html`, in document order.
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
  /** @type {string[]} */
  const hashes = [];
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    const body = asParsed(match[1] ?? "");
    if (!body) continue;
    hashes.push(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return hashes;
}

/**
 * @param {string[]} scriptHashes
 * @returns {string}
 */
export function buildCsp(scriptHashes) {
  return CSP_DIRECTIVES.map(([name, value]) =>
    name === "script-src" && scriptHashes.length
      ? `${name} ${value} ${scriptHashes.join(" ")}`
      : `${name} ${value}`,
  ).join("; ");
}

/**
 * Adds the policy to the catch-all `/*` rule of a Cloudflare `_headers` file. Throws rather than
 * shipping without one: a missing rule or an existing policy means the file changed shape.
 * @param {string} headers
 * @param {string} csp
 * @returns {string}
 */
export function injectCsp(headers, csp) {
  if (/Content-Security-Policy:/i.test(headers)) {
    throw new Error("_headers already sets a Content-Security-Policy");
  }
  const lines = headers.split("\n");
  const at = lines.findIndex((l) => l.trim() === "/*");
  if (at === -1) throw new Error("_headers has no catch-all /* rule to attach the CSP to");
  lines.splice(at + 1, 0, `  Content-Security-Policy: ${csp}`);
  return lines.join("\n");
}
