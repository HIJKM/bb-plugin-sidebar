import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DESKTOP_LAYOUT_CHANNEL,
  DESKTOP_LAYOUT_EVENT,
  DESKTOP_LAYOUT_SETTING,
  desktopLayoutFromSettingsBody,
  desktopLayoutStorageKey,
  readDesktopLayoutDetail,
  readDesktopLayoutEnabled,
} from "./desktop-layout.ts";

test("desktop layout defaults on and stores off per plugin", () => {
  const key = desktopLayoutStorageKey("sidebar");
  const values = new Map<string, string>();
  const storage = {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
  };
  assert.equal(key, "sidebar:desktop-layout");
  assert.equal(readDesktopLayoutEnabled(storage, "sidebar"), true);
  storage.setItem(key, "off");
  assert.equal(readDesktopLayoutEnabled(storage, "sidebar"), false);
  storage.setItem(key, "on");
  assert.equal(readDesktopLayoutEnabled(storage, "sidebar"), true);
  assert.equal(readDesktopLayoutEnabled(storage, "other"), true);
});

test("desktop layout settings body accepts only a boolean", () => {
  assert.equal(desktopLayoutFromSettingsBody(null), null);
  assert.equal(desktopLayoutFromSettingsBody({ ok: true, values: {} }), null);
  assert.equal(
    desktopLayoutFromSettingsBody({ ok: true, values: { [DESKTOP_LAYOUT_SETTING]: false } }),
    false,
  );
  assert.equal(
    desktopLayoutFromSettingsBody({ ok: true, values: { [DESKTOP_LAYOUT_SETTING]: true } }),
    true,
  );
  assert.equal(
    desktopLayoutFromSettingsBody({ ok: true, values: { [DESKTOP_LAYOUT_SETTING]: "false" } }),
    null,
  );
});

test("desktop layout event detail names the plugin and the boolean", () => {
  assert.equal(readDesktopLayoutDetail(null), null);
  assert.equal(readDesktopLayoutDetail({ pluginId: "sidebar" }), null);
  assert.deepEqual(readDesktopLayoutDetail({ pluginId: "sidebar", enabled: false }), {
    pluginId: "sidebar",
    enabled: false,
  });
  assert.equal(DESKTOP_LAYOUT_EVENT, "bb-sidebar-desktop-layout");
  assert.equal(DESKTOP_LAYOUT_CHANNEL, "desktop-layout");
});

test("server declares the desktop layout switch defaulting to on", () => {
  const source = readFileSync(new URL("../server.ts", import.meta.url), "utf8");
  assert.match(source, /\[DESKTOP_LAYOUT_SETTING\]:\s*\{[^}]*type:\s*"boolean"/);
  assert.match(source, /default:\s*true/);
  assert.match(source, /DESKTOP_LAYOUT_CHANNEL/);
});
