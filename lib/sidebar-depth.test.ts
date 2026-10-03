import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySidebarDepth,
  injectSidebarDepth,
  mobileShelfProgress,
  readSidebarDepth,
  readTranslateX,
  sidebarDepthProgress,
  syncSidebarDepth,
} from "./sidebar-depth.ts";

describe("sidebarDepthProgress", () => {
  it("follows how much of the panel is still on screen", () => {
    assert.equal(sidebarDepthProgress({ left: 0, width: 256 }), 1);
    assert.equal(sidebarDepthProgress({ left: -128, width: 256 }), 0.5);
    assert.equal(sidebarDepthProgress({ left: -256, width: 256 }), 0);
  });
});

describe("mobileShelfProgress", () => {
  it("maps inset translate to the same 0-1 range", () => {
    assert.equal(mobileShelfProgress(0, 320), 0);
    assert.equal(mobileShelfProgress(160, 320), 0.5);
    assert.equal(mobileShelfProgress(320, 320), 1);
  });
});

describe("readTranslateX", () => {
  it("reads translate and matrix values", () => {
    assert.equal(readTranslateX({ translate: "120px" }), 120);
    assert.equal(readTranslateX({ transform: "matrix(1, 0, 0, 1, 80, 0)" }), 80);
    assert.equal(readTranslateX({ transform: "none" }), 0);
  });
});

describe("applySidebarDepth", () => {
  it("writes the depth variable and parks only when fully receded", () => {
    const panel = {
      dataset: {} as Record<string, string | undefined>,
      style: {
        props: new Map<string, string>(),
        setProperty(name: string, value: string) {
          this.props.set(name, value);
        },
      },
    };
    applySidebarDepth(panel as unknown as HTMLElement, 0.4);
    assert.equal(panel.style.props.get("--lite-sidebar-depth"), "0.4");
    assert.equal(panel.dataset.liteSidebarParked, undefined);
    applySidebarDepth(panel as unknown as HTMLElement, 0);
    assert.equal(panel.dataset.liteSidebarParked, "");
  });
});

describe("readSidebarDepth", () => {
  it("uses the mobile inset when the drawer attribute is present", () => {
    const inset = { style: { translate: "80px", transform: "" } };
    const panel = {
      getAttribute: (name: string) => (name === "data-vaul-drawer-direction" ? "left" : null),
      getBoundingClientRect: () => ({ left: 0, width: 160 }),
    };
    const doc = {
      querySelector: () => inset,
      defaultView: null,
    };
    assert.equal(readSidebarDepth(doc as unknown as Document, panel as unknown as HTMLElement), 0.5);
  });
});

describe("syncSidebarDepth", () => {
  it("applies the current desktop rect to the panel", () => {
    const panel = {
      dataset: {} as Record<string, string | undefined>,
      getAttribute: () => null,
      getBoundingClientRect: () => ({ left: -64, width: 256 }),
      style: {
        props: new Map<string, string>(),
        setProperty(name: string, value: string) {
          this.props.set(name, value);
        },
      },
    };
    const doc = {
      defaultView: null,
      querySelectorAll: () => [panel],
    };
    assert.equal(syncSidebarDepth(doc as unknown as Document), 1);
    assert.equal(panel.style.props.get("--lite-sidebar-depth"), "0.75");
  });
});

describe("injectSidebarDepth", () => {
  it("writes a position-driven stylesheet and removes it on cleanup", () => {
    const nodes: { id: string; textContent: string }[] = [];
    const doc = {
      getElementById: (id: string) => nodes.find((node) => node.id === id) ?? null,
      createElement: () => {
        const node = {
          id: "",
          textContent: "",
          remove() {
            const index = nodes.indexOf(node);
            if (index >= 0) nodes.splice(index, 1);
          },
        };
        return node;
      },
      head: {
        append(node: { id: string }) {
          nodes.push(node as { id: string; textContent: string });
        },
      },
    };
    const stop = injectSidebarDepth(doc as unknown as Document);
    assert.equal(nodes.length, 1);
    assert.match(nodes[0].textContent, /--lite-sidebar-depth/);
    assert.match(nodes[0].textContent, /720ms/);
    assert.doesNotMatch(nodes[0].textContent, /transform 420ms/);
    stop();
    assert.equal(nodes.length, 0);
  });
});
