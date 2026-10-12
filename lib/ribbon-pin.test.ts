import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  applyRibbonPinAttribute,
  readRibbonPinEnabled,
  RIBBON_PIN_ATTRIBUTE,
  ribbonPinStorageKey,
} from "./ribbon-pin.ts";

test("ribbon pin defaults off and stores on per plugin", () => {
  const key = ribbonPinStorageKey("sidebar");
  const values = new Map<string, string>();
  const storage = {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
  };
  assert.equal(readRibbonPinEnabled(storage, "sidebar"), false);
  storage.setItem(key, "on");
  assert.equal(readRibbonPinEnabled(storage, "sidebar"), true);
  assert.equal(readRibbonPinEnabled(storage, "other"), false);
});

test("ribbon pin attribute follows the boolean and the server switch defaults off", () => {
  const attrs = new Set<string>();
  const root = {
    toggleAttribute(name: string, on: boolean) {
      if (on) attrs.add(name);
      else attrs.delete(name);
    },
  };
  applyRibbonPinAttribute(root, true);
  assert.deepEqual([...attrs], [RIBBON_PIN_ATTRIBUTE]);
  applyRibbonPinAttribute(root, false);
  assert.equal(attrs.size, 0);
  const source = readFileSync(new URL("../server.ts", import.meta.url), "utf8");
  assert.match(source, /\[RIBBON_PIN_SETTING\]:\s*\{[^}]*default:\s*false/);
  assert.match(source, /RIBBON_PIN_CHANNEL/);
});
