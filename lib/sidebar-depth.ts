const STYLE_ID = "bb-motion";
const DEPTH_VAR = "--lite-sidebar-depth";
const PARKED = "liteSidebarParked";
const SLIDE_MS = 720;
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const SIDEBAR_DEPTH_CSS = `
[data-sidebar="gap"] {
  transition: width ${SLIDE_MS}ms ${SLIDE_EASE} !important;
}
[data-sidebar="panel"] {
  ${DEPTH_VAR}: 1;
  filter: brightness(calc(0.7 + var(${DEPTH_VAR}) * 0.3));
  opacity: calc(0.16 + var(${DEPTH_VAR}) * 0.84);
  transform: perspective(1100px)
    translate3d(
      calc((1 - var(${DEPTH_VAR})) * -8%),
      calc((1 - var(${DEPTH_VAR})) * 14px),
      calc((1 - var(${DEPTH_VAR})) * -160px)
    )
    scale(calc(0.88 + var(${DEPTH_VAR}) * 0.12));
  transform-origin: 0% 42%;
  transition:
    left ${SLIDE_MS}ms ${SLIDE_EASE},
    width ${SLIDE_MS}ms ${SLIDE_EASE},
    visibility 0s linear 0s !important;
  visibility: visible !important;
}
[data-sidebar="panel"][data-lite-sidebar-parked] {
  pointer-events: none;
  visibility: hidden !important;
}
@media (prefers-reduced-motion: reduce) {
  [data-sidebar="gap"],
  [data-sidebar="panel"] {
    filter: none !important;
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
`;

export function sidebarDepthProgress(box: { left: number; width: number }): number {
  if (box.width <= 0) return 0;
  return clamp((box.left + box.width) / box.width);
}

export function mobileShelfProgress(translateX: number, width: number): number {
  if (width <= 0) return 0;
  return clamp(translateX / width);
}

export function readTranslateX(style: { translate?: string; transform?: string }): number {
  const translate = style.translate ?? "";
  if (translate !== "" && translate !== "none") {
    return Number.parseFloat(translate) || 0;
  }
  const transform = style.transform ?? "";
  if (transform === "" || transform === "none") return 0;
  if (typeof DOMMatrix !== "undefined") {
    try {
      return new DOMMatrix(transform).m41;
    } catch {
      return 0;
    }
  }
  if (transform.startsWith("matrix3d(")) {
    const nums = transform.slice(9, -1).split(",").map((n) => Number.parseFloat(n));
    return nums[12] || 0;
  }
  if (transform.startsWith("matrix(")) {
    const nums = transform.slice(7, -1).split(",").map((n) => Number.parseFloat(n));
    return nums[4] || 0;
  }
  return 0;
}

export function applySidebarDepth(panel: HTMLElement, progress: number): void {
  const next = clamp(progress);
  panel.style.setProperty(DEPTH_VAR, String(next));
  if (next <= 0.012) panel.dataset[PARKED] = "";
  else delete panel.dataset[PARKED];
}

export function readSidebarDepth(doc: Document, panel: HTMLElement): number {
  if (panel.getAttribute("data-vaul-drawer-direction") !== null) {
    const inset = doc.querySelector<HTMLElement>('[data-sidebar="inset"]');
    const width = panel.getBoundingClientRect().width;
    if (inset === null) {
      return panel.getAttribute("data-state") === "open" ? 1 : 0;
    }
    const style = doc.defaultView?.getComputedStyle?.(inset) ?? {
      translate: inset.style.translate,
      transform: inset.style.transform,
    };
    return mobileShelfProgress(readTranslateX(style), width);
  }
  return sidebarDepthProgress(panel.getBoundingClientRect());
}

export function syncSidebarDepth(doc: Document): number {
  if (prefersReducedMotion(doc)) return 0;
  let count = 0;
  doc.querySelectorAll<HTMLElement>('[data-sidebar="panel"]').forEach((panel) => {
    applySidebarDepth(panel, readSidebarDepth(doc, panel));
    count += 1;
  });
  return count;
}

export function injectSidebarDepth(doc: Document): () => void {
  const existing = doc.getElementById(STYLE_ID);
  existing?.remove();
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = SIDEBAR_DEPTH_CSS;
  doc.head.append(style);
  const stopTrack = trackSidebarDepth(doc);
  return () => {
    stopTrack();
    style.remove();
  };
}

function trackSidebarDepth(doc: Document): () => void {
  if (typeof doc.querySelectorAll !== "function") return () => {};
  const view = doc.defaultView;
  const raf = view?.requestAnimationFrame?.bind(view);
  const cancel = view?.cancelAnimationFrame?.bind(view);
  if (raf === undefined) {
    syncSidebarDepth(doc);
    return () => {};
  }

  let frame = 0;
  let still = 0;
  let last = "";
  const tick = (): void => {
    const next = snapshot(doc);
    if (next !== last) {
      last = next;
      still = 0;
      syncSidebarDepth(doc);
    } else {
      still += 1;
    }
    if (still < 10) frame = raf(tick);
    else frame = 0;
  };
  const kick = (): void => {
    still = 0;
    if (frame === 0) frame = raf(tick);
  };

  kick();
  const mutations = new MutationObserver(kick);
  mutations.observe(doc.body ?? doc.documentElement, {
    attributeFilter: [
      "class",
      "data-collapsible",
      "data-sidebar-shelf",
      "data-state",
      "style",
    ],
    attributes: true,
    subtree: true,
  });
  const resize = typeof ResizeObserver === "function" ? new ResizeObserver(kick) : null;
  doc.querySelectorAll('[data-sidebar="panel"], [data-sidebar="inset"]').forEach((node) => {
    resize?.observe(node);
  });
  view?.addEventListener("pointerdown", kick, true);
  view?.addEventListener("pointermove", kick, true);
  view?.addEventListener("wheel", kick, { capture: true, passive: true });
  view?.addEventListener("resize", kick);

  return () => {
    if (frame !== 0) cancel?.(frame);
    mutations.disconnect();
    resize?.disconnect();
    view?.removeEventListener("pointerdown", kick, true);
    view?.removeEventListener("pointermove", kick, true);
    view?.removeEventListener("wheel", kick, true);
    view?.removeEventListener("resize", kick);
  };
}

function snapshot(doc: Document): string {
  return Array.from(doc.querySelectorAll<HTMLElement>('[data-sidebar="panel"]'))
    .map((panel) => {
      const box = panel.getBoundingClientRect();
      return `${box.left}:${box.width}:${readSidebarDepth(doc, panel).toFixed(3)}`;
    })
    .join("|");
}

function prefersReducedMotion(doc: Document): boolean {
  return doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
