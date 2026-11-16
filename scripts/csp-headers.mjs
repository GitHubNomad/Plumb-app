// Post-build: hash the inline scripts in the built shell and add Plumb's Content-Security-Policy
// to dist/client/_headers. Runs as part of `npm run build`, so every deploy carries a policy that
// matches the exact HTML it ships. Fails the build rather than shipping without one.
import { readFileSync, writeFileSync } from "node:fs";
import { buildCsp, injectCsp, inlineScriptHashes } from "./csp.mjs";

const root = new URL("../dist/client/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const headersUrl = new URL("_headers", root);

const hashes = inlineScriptHashes(html);
const csp = buildCsp(hashes);
writeFileSync(headersUrl, injectCsp(readFileSync(headersUrl, "utf8"), csp));
console.log(`CSP added to _headers (${hashes.length} inline script hash(es))`);
