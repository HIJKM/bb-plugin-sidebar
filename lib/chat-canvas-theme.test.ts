import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("sidebar plugin ships darker chat and sidebar surfaces as a theme", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const themes = pkg.bb.themes;
  assert.deepEqual(themes, [
    { id: "chat-canvas", name: "Chat canvas", css: "./themes/chat-canvas.css" },
  ]);
  const css = readFileSync(new URL(`../${themes[0].css}`, import.meta.url), "utf8");
  assert.match(css, /:root, \.light \{\s*--canvas: oklch\(0\.95 0 0\);\s*--sidebar: oklch\(0\.93 0 0\);\s*\}/);
  assert.match(css, /\.dark \{\s*--canvas: oklch\(0\.15 0 0\);\s*--sidebar: oklch\(0\.18 0 0\);\s*\}/);
  assert.doesNotMatch(css, /--(?:background|ink|card|primary|success|destructive):/);
});
