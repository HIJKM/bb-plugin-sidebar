export const DESKTOP_LAYOUT_SETTING = "desktopLayout";
export const DESKTOP_LAYOUT_CHANNEL = "desktop-layout";
export const DESKTOP_LAYOUT_EVENT = "bb-sidebar-desktop-layout";

export function desktopLayoutStorageKey(pluginId: string): string {
  return `${pluginId}:desktop-layout`;
}

export function readDesktopLayoutEnabled(
  storage: { getItem(name: string): string | null } | null | undefined,
  pluginId: string,
): boolean {
  try {
    return storage?.getItem(desktopLayoutStorageKey(pluginId)) !== "off";
  } catch {
    return true;
  }
}

export function writeDesktopLayoutEnabled(
  storage: { setItem(name: string, value: string): void } | null | undefined,
  pluginId: string,
  enabled: boolean,
): void {
  try {
    storage?.setItem(desktopLayoutStorageKey(pluginId), enabled ? "on" : "off");
  } catch {
    // Private browsing can reject storage. The live stylesheet still updates.
  }
}

export function desktopLayoutFromSettingsBody(body: unknown): boolean | null {
  if (body === null || typeof body !== "object") return null;
  if (Reflect.get(body, "ok") !== true) return null;
  const values = Reflect.get(body, "values");
  if (values === null || typeof values !== "object") return null;
  const value = Reflect.get(values, DESKTOP_LAYOUT_SETTING);
  return typeof value === "boolean" ? value : null;
}

export function readDesktopLayoutDetail(
  detail: unknown,
): { pluginId: string; enabled: boolean } | null {
  if (detail === null || typeof detail !== "object") return null;
  const pluginId = Reflect.get(detail, "pluginId");
  const enabled = Reflect.get(detail, "enabled");
  if (typeof pluginId !== "string" || typeof enabled !== "boolean") return null;
  return { pluginId, enabled };
}

export async function fetchDesktopLayoutEnabled(
  pluginId: string,
  fetchImpl: (input: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>,
): Promise<boolean | null> {
  const response = await fetchImpl(`/api/v1/plugins/${encodeURIComponent(pluginId)}/settings`);
  if (!response.ok) return null;
  return desktopLayoutFromSettingsBody(await response.json());
}
