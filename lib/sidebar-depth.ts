const STYLE_ID = "bb-motion";
const DEPTH_VAR = "--lite-sidebar-depth";
const RIGHT_DEPTH_VAR = "--bb-motion-right-depth";
const PARKED = "liteSidebarParked";
const RIGHT_PARKED = "bbMotionRightParked";
const RIGHT_PIN = "bbMotionPin";
const SCREEN = "bbMotionScreen";
const SCREEN_MOVE_PX = 1;
const SLIDE_MS = 720;
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const RIGHT_PANEL = "[data-panel] > aside";
const RIGHT_SHELF = '[data-testid="secondary-panel-shelf"]';

const RIGHT_DEPTH_LOOK = `
  filter: brightness(calc(0.7 + var(${RIGHT_DEPTH_VAR}) * 0.3));
  opacity: 1;
`;

const SIDEBAR_DEPTH_CSS = `
[data-sidebar="gap"] {
  transition: width ${SLIDE_MS}ms ${SLIDE_EASE} !important;
}
[data-sidebar="panel"] {
  ${DEPTH_VAR}: 1;
  filter: brightness(calc(0.7 + var(${DEPTH_VAR}) * 0.3));
  opacity: 1;
  transition:
    left ${SLIDE_MS}ms ${SLIDE_EASE},
    width ${SLIDE_MS}ms ${SLIDE_EASE},
    visibility 0s linear 0s !important;
  visibility: visible !important;
}
[data-sidebar="panel"][data-vaul-drawer-direction="left"] {
  transform: translateX(calc((1 - var(${DEPTH_VAR})) * -50%));
}
[data-sidebar="panel"][data-lite-sidebar-parked] {
  pointer-events: none;
  visibility: hidden !important;
}
[data-panel-group][style*="220ms"]:has(${RIGHT_PANEL}),
[style*="220ms"]:has(> [data-panel-group] ${RIGHT_PANEL}) {
  --panel-collapse-duration: ${SLIDE_MS}ms !important;
}
${RIGHT_PANEL} {
  ${RIGHT_DEPTH_VAR}: 1;
  ${RIGHT_DEPTH_LOOK}
}
${RIGHT_PANEL}[data-bb-motion-pin] {
  left: auto !important;
  right: 0 !important;
}
${RIGHT_PANEL}[data-bb-motion-right-parked] {
  pointer-events: none;
}
${RIGHT_SHELF} {
  z-index: 0 !important;
  ${RIGHT_DEPTH_VAR}: 1;
  ${RIGHT_DEPTH_LOOK}
  transform: translateX(calc((1 - var(${RIGHT_DEPTH_VAR})) * 50%));
}
${RIGHT_SHELF}[data-state="closed"] {
  visibility: hidden !important;
  transition: visibility 0s linear ${SLIDE_MS}ms !important;
}
[data-sidebar="inset"][data-panel-shelf] {
  transition: translate ${SLIDE_MS}ms ${SLIDE_EASE};
}
@media (max-width: 767px) {
  [data-sidebar="inset"][data-bb-motion-screen] {
    border-radius: 55px;
    overflow: clip;
  }
  [data-sidebar="panel"][data-vaul-drawer-direction="left"] {
    border-right-color: transparent;
    box-shadow: 67px 0 0 0 var(--sidebar);
  }
  [data-testid="secondary-panel-shelf"] {
    background-color: var(--sidebar);
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-sidebar="gap"],
  [data-sidebar="panel"],
  ${RIGHT_PANEL},
  ${RIGHT_SHELF} {
    filter: none !important;
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  [data-panel-group][style*="220ms"]:has(${RIGHT_PANEL}),
  [style*="220ms"]:has(> [data-panel-group] ${RIGHT_PANEL}) {
    --panel-collapse-duration: 220ms !important;
  }
  ${RIGHT_PANEL}[data-bb-motion-pin] {
    left: 0 !important;
    right: auto !important;
  }
}
`;

export function keepWatchingSlide(idleMs: number): boolean {
  return idleMs < SLIDE_MS;
}

export function sidebarDepthProgress(box: { left: number; width: number }): number {
  if (box.width <= 0) return 0;
  return clamp((box.left + box.width) / box.width);
}

export function rightPanelDepthProgress(
  panel: { left: number; right: number; width: number },
  clip: { left: number; right: number },
): number {
  if (panel.width <= 0) return 0;
  const visible = Math.max(0, Math.min(panel.right, clip.right) - Math.max(panel.left, clip.left));
  return clamp(visible / panel.width);
}

export function rightShelfProgress(translateX: number, width: number): number {
  if (width <= 0) return 0;
  return clamp(Math.abs(translateX) / width);
}

export function mobileShelfProgress(translateX: number, width: number): number {
  if (width <= 0) return 0;
  return clamp(translateX / width);
}

export function readTranslateX(
  style: { translate?: string; transform?: string },
  referenceWidth = 0,
): number {
  const translate = style.translate ?? "";
  if (translate !== "" && translate !== "none") {
    return parseTranslateToken(translate.trim().split(/\s+/)[0] ?? "", referenceWidth);
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

export type SidebarSide = "left" | "right" | "rest";
export type SidebarHaptic = "open" | "close";
export type SidebarPhase = { side: SidebarSide; closeSent: boolean };

export function readSidebarSide(sample: {
  translateX: number;
  sidebarShelf: string | null;
  panelShelf: string | null;
}): SidebarSide {
  if (sample.translateX > SCREEN_MOVE_PX) return "left";
  if (sample.translateX < -SCREEN_MOVE_PX) return "right";
  if (sample.sidebarShelf === "open") return "left";
  if (sample.panelShelf === "shelf" || sample.panelShelf === "full") return "right";
  return "rest";
}

export function nextSidebarPhase(
  phase: SidebarPhase,
  sample: { translateX: number; sidebarShelf: string | null; panelShelf: string | null },
): { phase: SidebarPhase; haptics: SidebarHaptic[] } {
  const motion: SidebarSide =
    sample.translateX > SCREEN_MOVE_PX ? "left" : sample.translateX < -SCREEN_MOVE_PX ? "right" : "rest";
  const attr: SidebarSide =
    sample.sidebarShelf === "open"
      ? "left"
      : sample.panelShelf === "shelf" || sample.panelShelf === "full"
        ? "right"
        : "rest";
  const visible = readSidebarSide(sample);
  if (phase.side === "rest" && visible !== "rest") {
    return { phase: { side: visible, closeSent: false }, haptics: ["open"] };
  }
  if (phase.side !== "rest" && attr !== phase.side && motion === phase.side && !phase.closeSent) {
    return { phase: { side: phase.side, closeSent: true }, haptics: ["close"] };
  }
  if (phase.closeSent && visible === "rest") {
    return { phase: { side: "rest", closeSent: false }, haptics: [] };
  }
  if (phase.side !== "rest" && visible === "rest" && !phase.closeSent) {
    return { phase: { side: "rest", closeSent: false }, haptics: ["close"] };
  }
  if (phase.side !== "rest" && visible !== "rest" && visible !== phase.side) {
    return {
      phase: { side: visible, closeSent: false },
      haptics: phase.closeSent ? ["open"] : ["close", "open"],
    };
  }
  return { phase, haptics: [] };
}

export function applyChatScreen(inset: HTMLElement, translateX: number): "push" | null {
  const wasOn = inset.dataset[SCREEN] !== undefined;
  const shelf = inset.getAttribute("data-sidebar-shelf");
  const panelShelf = inset.getAttribute("data-panel-shelf");
  const heldOpen = shelf === "open" || panelShelf === "shelf" || panelShelf === "full";
  const on = heldOpen || Math.abs(translateX) > SCREEN_MOVE_PX;
  if (on) inset.dataset[SCREEN] = "";
  else delete inset.dataset[SCREEN];
  return on && !wasOn ? "push" : null;
}

export function postSlideHaptic(native: {
  post?: (message: unknown) => void;
  capabilities?: readonly string[];
} | null): boolean {
  if (native === null || typeof native.post !== "function") return false;
  if (!native.capabilities?.includes("haptic")) return false;
  try {
    native.post({ type: "haptic", kind: "impact-light" });
  } catch {
    return false;
  }
  return true;
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

export function applyRightDepth(panel: HTMLElement, progress: number, pin: boolean): void {
  const next = clamp(progress);
  panel.style.setProperty(RIGHT_DEPTH_VAR, String(next));
  if (pin) panel.dataset[RIGHT_PIN] = "";
  else delete panel.dataset[RIGHT_PIN];
  if (next <= 0.012) panel.dataset[RIGHT_PARKED] = "";
  else delete panel.dataset[RIGHT_PARKED];
}

export function readRightDepth(aside: HTMLElement): number {
  const clip = aside.parentElement?.getBoundingClientRect();
  if (clip === undefined) return 1;
  return rightPanelDepthProgress(aside.getBoundingClientRect(), clip);
}

export function readRightShelfDepth(doc: Document, shelf: HTMLElement): number {
  const inset = doc.querySelector<HTMLElement>('[data-sidebar="inset"]');
  const width = shelf.getBoundingClientRect().width;
  if (inset === null || width <= 0) {
    return shelf.getAttribute("data-state") === "closed" ? 0 : 1;
  }
  const style = doc.defaultView?.getComputedStyle?.(inset) ?? {
    translate: inset.style.translate,
    transform: inset.style.transform,
  };
  return rightShelfProgress(readTranslateX(style, inset.getBoundingClientRect().width), width);
}

export function syncSidebarDepth(doc: Document): number {
  syncChatScreen(doc);
  if (prefersReducedMotion(doc)) return 0;
  let count = 0;
  doc.querySelectorAll<HTMLElement>('[data-sidebar="panel"]').forEach((panel) => {
    applySidebarDepth(panel, readSidebarDepth(doc, panel));
    count += 1;
  });
  doc.querySelectorAll<HTMLElement>(RIGHT_PANEL).forEach((aside) => {
    const pin = aside.style.width !== "";
    if (pin) aside.dataset[RIGHT_PIN] = "";
    else delete aside.dataset[RIGHT_PIN];
    applyRightDepth(aside, readRightDepth(aside), pin);
    count += 1;
  });
  doc.querySelectorAll<HTMLElement>(RIGHT_SHELF).forEach((shelf) => {
    applyRightDepth(shelf, readRightShelfDepth(doc, shelf), false);
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
  let idleFrom = 0;
  let last = "";
  const now = (): number => view?.performance?.now?.() ?? 0;
  let resize: ResizeObserver | null = null;
  const seen = new WeakSet<Element>();
  const watch = (node: Element | null): void => {
    if (node === null || seen.has(node)) return;
    seen.add(node);
    resize?.observe(node);
  };
  const watchAll = (): void => {
    doc.querySelectorAll('[data-sidebar="panel"], [data-sidebar="inset"]').forEach(watch);
    doc.querySelectorAll<HTMLElement>(RIGHT_PANEL).forEach((aside) => {
      watch(aside);
      watch(aside.parentElement);
    });
    doc.querySelectorAll(RIGHT_SHELF).forEach(watch);
  };
  const tick = (time: number): void => {
    watchAll();
    const next = snapshot(doc);
    if (next !== last) {
      last = next;
      idleFrom = time;
      syncSidebarDepth(doc);
    }
    if (keepWatchingSlide(time - idleFrom)) frame = raf(tick);
    else frame = 0;
  };
  const kick = (): void => {
    idleFrom = now();
    if (frame === 0) frame = raf(tick);
  };
  const followSlide = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.matches(
        '[data-sidebar="inset"], [data-sidebar="panel"], [data-panel] > aside, [data-testid="secondary-panel-shelf"]',
      )
    ) {
      kick();
    }
  };
  resize = typeof ResizeObserver === "function" ? new ResizeObserver(kick) : null;

  kick();
  const mutations = new MutationObserver(kick);
  mutations.observe(doc.body ?? doc.documentElement, {
    attributeFilter: [
      "class",
      "data-collapsible",
      "data-panel-shelf",
      "data-sidebar-shelf",
      "data-state",
      "style",
    ],
    attributes: true,
    subtree: true,
  });
  watchAll();
  view?.addEventListener("pointerdown", kick, true);
  view?.addEventListener("pointermove", kick, true);
  view?.addEventListener("wheel", kick, { capture: true, passive: true });
  view?.addEventListener("resize", kick);
  view?.addEventListener("transitionrun", followSlide, true);
  view?.addEventListener("transitionend", followSlide, true);

  return () => {
    clearChatScreen(doc);
    if (frame !== 0) cancel?.(frame);
    mutations.disconnect();
    resize?.disconnect();
    view?.removeEventListener("pointerdown", kick, true);
    view?.removeEventListener("pointermove", kick, true);
    view?.removeEventListener("wheel", kick, true);
    view?.removeEventListener("resize", kick);
    view?.removeEventListener("transitionrun", followSlide, true);
    view?.removeEventListener("transitionend", followSlide, true);
  };
}

function clearChatScreen(doc: Document): void {
  chatScreenPrimed = false;
  sidebarPhase = { side: "rest", closeSent: false };
  if (typeof doc.querySelector !== "function") return;
  const inset = doc.querySelector<HTMLElement>('[data-sidebar="inset"]');
  if (inset !== null) delete inset.dataset[SCREEN];
}

function snapshot(doc: Document): string {
  const left = Array.from(doc.querySelectorAll<HTMLElement>('[data-sidebar="panel"]'))
    .map((panel) => {
      const box = panel.getBoundingClientRect();
      return `${box.left}:${box.width}:${readSidebarDepth(doc, panel).toFixed(3)}`;
    })
    .join("|");
  const right = Array.from(doc.querySelectorAll<HTMLElement>(`${RIGHT_PANEL}, ${RIGHT_SHELF}`))
    .map((panel) => {
      const box = panel.getBoundingClientRect();
      const depth = panel.matches(RIGHT_SHELF)
        ? readRightShelfDepth(doc, panel)
        : readRightDepth(panel);
      return `${box.left}:${box.width}:${depth.toFixed(3)}`;
    })
    .join("|");
  return `${left}#${right}`;
}

let chatScreenPrimed = false;
let sidebarPhase: SidebarPhase = { side: "rest", closeSent: false };

function syncChatScreen(doc: Document): void {
  if (typeof doc.querySelector !== "function") return;
  const inset = doc.querySelector<HTMLElement>('[data-sidebar="inset"]');
  if (inset === null) return;
  if (prefersReducedMotion(doc)) {
    delete inset.dataset[SCREEN];
    sidebarPhase = { side: "rest", closeSent: false };
    return;
  }
  const style = doc.defaultView?.getComputedStyle?.(inset) ?? {
    translate: inset.style.translate,
    transform: inset.style.transform,
  };
  const width = inset.getBoundingClientRect?.().width ?? 0;
  const translateX = readTranslateX(style, width);
  applyChatScreen(inset, translateX);
  const sample = {
    translateX,
    sidebarShelf: inset.getAttribute("data-sidebar-shelf"),
    panelShelf: inset.getAttribute("data-panel-shelf"),
  };
  if (!chatScreenPrimed) {
    chatScreenPrimed = true;
    sidebarPhase = { side: readSidebarSide(sample), closeSent: false };
    return;
  }
  const step = nextSidebarPhase(sidebarPhase, sample);
  sidebarPhase = step.phase;
  if (step.haptics.length === 0) return;
  const native = readNativeBridge(doc);
  for (const _haptic of step.haptics) postSlideHaptic(native);
}

function readNativeBridge(doc: Document): {
  post?: (message: unknown) => void;
  capabilities?: readonly string[];
} | null {
  const root = doc.defaultView as
    | (Window & { bb?: { native?: { post?: (message: unknown) => void; capabilities?: readonly string[] } } })
    | null;
  return root?.bb?.native ?? null;
}

function parseTranslateToken(token: string, referenceWidth: number): number {
  if (token.endsWith("%")) {
    const percent = Number.parseFloat(token);
    return Number.isFinite(percent) ? (percent / 100) * referenceWidth : 0;
  }
  return Number.parseFloat(token) || 0;
}

function prefersReducedMotion(doc: Document): boolean {
  return doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
