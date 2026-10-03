import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyRightDepth,
  applySidebarDepth,
  injectSidebarDepth,
  mobileShelfProgress,
  readRightDepth,
  readRightShelfDepth,
  readSidebarDepth,
  readTranslateX,
  rightPanelDepthProgress,
  rightShelfProgress,
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

describe("rightPanelDepthProgress", () => {
  it("measures how much of the right panel the clip still shows", () => {
    const panel = { left: 100, right: 300, width: 200 };
    assert.equal(rightPanelDepthProgress(panel, { left: 100, right: 300 }), 1);
    assert.equal(rightPanelDepthProgress(panel, { left: 200, right: 300 }), 0.5);
    assert.equal(rightPanelDepthProgress(panel, { left: 300, right: 300 }), 0);
  });
});

describe("rightShelfProgress", () => {
  it("maps a leftward inset translate onto the shelf width", () => {
    assert.equal(rightShelfProgress(0, 320), 0);
    assert.equal(rightShelfProgress(-160, 320), 0.5);
    assert.equal(rightShelfProgress(-320, 320), 1);
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

  it("resolves a percentage against the element that is translating", () => {
    assert.equal(readTranslateX({ translate: "-100%" }, 390), -390);
    assert.equal(readTranslateX({ translate: "-50% 0px" }, 390), -195);
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

describe("readRightDepth", () => {
  it("pins a sized panel to the right and reads the clip overlap", () => {
    const clip = { left: 200, right: 300, width: 100 };
    const aside = {
      dataset: {} as Record<string, string | undefined>,
      style: {
        width: "40cqw",
        props: new Map<string, string>(),
        setProperty(name: string, value: string) {
          this.props.set(name, value);
        },
      },
      parentElement: { getBoundingClientRect: () => clip },
      getBoundingClientRect: () => ({ left: 100, right: 300, width: 200 }),
    };
    const doc = {
      defaultView: null,
      querySelectorAll: (selector: string) =>
        selector === "[data-panel] > aside" ? [aside] : [],
    };
    assert.equal(syncSidebarDepth(doc as unknown as Document), 1);
    assert.equal(aside.dataset.bbMotionPin, "");
    assert.equal(readRightDepth(aside as unknown as HTMLElement), 0.5);
    assert.equal(aside.style.props.get("--bb-motion-right-depth"), "0.5");
  });
});

describe("readRightShelfDepth", () => {
  function shelfDoc(translate: string, insetWidth: number, shelfWidth: number) {
    const inset = {
      style: { translate: "", transform: "" },
      getBoundingClientRect: () => ({ width: insetWidth }),
    };
    const shelf = {
      getAttribute: () => "full",
      getBoundingClientRect: () => ({ width: shelfWidth }),
    };
    const doc = {
      querySelector: () => inset,
      defaultView: {
        getComputedStyle: () => ({ translate, transform: "none" }),
      },
    };
    return { doc, shelf };
  }

  it("opens fully when the mobile full shelf translate is -100%", () => {
    const { doc, shelf } = shelfDoc("-100%", 390, 390);
    assert.equal(
      readRightShelfDepth(doc as unknown as Document, shelf as unknown as HTMLElement),
      1,
    );
  });

  it("resolves a percentage against the inset width", () => {
    const { doc, shelf } = shelfDoc("-50%", 200, 400);
    assert.equal(
      readRightShelfDepth(doc as unknown as Document, shelf as unknown as HTMLElement),
      0.25,
    );
  });
});

describe("applyRightDepth", () => {
  it("drops the right pin when the panel is being dragged", () => {
    const panel = {
      dataset: { bbMotionPin: "" } as Record<string, string | undefined>,
      style: {
        props: new Map<string, string>(),
        setProperty(name: string, value: string) {
          this.props.set(name, value);
        },
      },
    };
    applyRightDepth(panel as unknown as HTMLElement, 1, false);
    assert.equal(panel.dataset.bbMotionPin, undefined);
    assert.equal(panel.dataset.bbMotionRightParked, undefined);
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
      querySelectorAll: (selector: string) =>
        selector === '[data-sidebar="panel"]' ? [panel] : [],
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
    assert.match(nodes[0].textContent, /--bb-motion-right-depth/);
    assert.doesNotMatch(
      nodes[0].textContent,
      /opacity: calc\(0\.16 \+ var\(--bb-motion-right-depth\)/,
    );
    assert.match(nodes[0].textContent, /720ms/);
    assert.doesNotMatch(nodes[0].textContent, /transform 420ms/);
    stop();
    assert.equal(nodes.length, 0);
  });
});
