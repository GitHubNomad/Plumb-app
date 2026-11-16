import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildCsp, injectCsp, inlineScriptHashes } from "./csp.mjs";

const sha = (s: string) => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

describe("inlineScriptHashes", () => {
  it("hashes inline scripts byte for byte and skips external ones", () => {
    const html =
      '<script data-x="">self.a=1;</script><script type="module" src="/assets/i.js"></script>' +
      "<script>document.currentScript.remove();</script>";
    expect(inlineScriptHashes(html)).toEqual([
      sha("self.a=1;"),
      sha("document.currentScript.remove();"),
    ]);
  });

  it("hashes what the HTML parser sees: NUL becomes U+FFFD, CRLF becomes LF", () => {
    const html = '<script>a="x\u0000";\r\nb=1</script>';
    expect(inlineScriptHashes(html)).toEqual([sha('a="x\uFFFD";\nb=1')]);
  });

  it("ignores empty script tags", () => {
    expect(inlineScriptHashes("<script></script>")).toEqual([]);
  });
});

describe("buildCsp", () => {
  const csp = buildCsp(["'sha256-abc'"]);

  it("only allows scripts from the site plus the hashed inline ones", () => {
    expect(csp).toContain("script-src 'self' 'sha256-abc';");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it("never lets scripts talk to another origin", () => {
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("form-action 'none'");
  });

  it("allows the blob: audio loop that keeps earbud controls alive", () => {
    expect(csp).toContain("media-src blob:");
  });
});

describe("injectCsp", () => {
  const headers = "/assets/*\n  Cache-Control: immutable\n\n/*\n  X-Content-Type-Options: nosniff\n";

  it("adds the policy to the catch-all rule", () => {
    expect(injectCsp(headers, "default-src 'none'")).toBe(
      "/assets/*\n  Cache-Control: immutable\n\n/*\n  Content-Security-Policy: default-src 'none'\n  X-Content-Type-Options: nosniff\n",
    );
  });

  it("refuses to ship when the file has no catch-all rule", () => {
    expect(() => injectCsp("/assets/*\n  A: b\n", "x")).toThrow(/catch-all/);
  });

  it("refuses to add a second policy", () => {
    expect(() => injectCsp(`${headers}  Content-Security-Policy: x\n`, "y")).toThrow(/already/);
  });
});
