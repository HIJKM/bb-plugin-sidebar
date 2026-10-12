export const RIBBON_PIN_SETTING = "pinRibbon";
export const RIBBON_PIN_CHANNEL = "ribbon-pin";
export const RIBBON_PIN_EVENT = "bb-sidebar-ribbon-pin";
export const RIBBON_PIN_ATTRIBUTE = "data-bb-sidebar-ribbon-pin";

export function ribbonPinStorageKey(pluginId: string): string {
  return `${pluginId}:ribbon-pin`;
}

export function readRibbonPinEnabled(
  storage: { getItem(name: string): string | null } | null | undefined,
  pluginId: string,
): boolean {
  try {
    return storage?.getItem(ribbonPinStorageKey(pluginId)) === "on";
  } catch {
    return false;
  }
}

export function writeRibbonPinEnabled(
  storage: { setItem(name: string, value: string): void } | null | undefined,
  pluginId: string,
  enabled: boolean,
): void {
  try {
    storage?.setItem(ribbonPinStorageKey(pluginId), enabled ? "on" : "off");
  } catch {
    // Private browsing can reject storage. The live attribute still updates.
  }
}

export function ribbonPinFromSettingsBody(body: unknown): boolean | null {
  if (body === null || typeof body !== "object") return null;
  if (Reflect.get(body, "ok") !== true) return null;
  const values = Reflect.get(body, "values");
  if (values === null || typeof values !== "object") return null;
  const value = Reflect.get(values, RIBBON_PIN_SETTING);
  return typeof value === "boolean" ? value : null;
}

export function readRibbonPinDetail(
  detail: unknown,
): { pluginId: string; enabled: boolean } | null {
  if (detail === null || typeof detail !== "object") return null;
  const pluginId = Reflect.get(detail, "pluginId");
  const enabled = Reflect.get(detail, "enabled");
  if (typeof pluginId !== "string" || typeof enabled !== "boolean") return null;
  return { pluginId, enabled };
}

export async function fetchRibbonPinEnabled(
  pluginId: string,
  fetchImpl: (input: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>,
): Promise<boolean | null> {
  const response = await fetchImpl(`/api/v1/plugins/${encodeURIComponent(pluginId)}/settings`);
  if (!response.ok) return null;
  return ribbonPinFromSettingsBody(await response.json());
}

export function applyRibbonPinAttribute(
  root: { toggleAttribute?(name: string, force?: boolean): void } | null | undefined,
  enabled: boolean,
): void {
  root?.toggleAttribute?.(RIBBON_PIN_ATTRIBUTE, enabled);
}
