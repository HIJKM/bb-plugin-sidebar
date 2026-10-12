import { useEffect } from "react";
import {
  definePluginApp,
  experimental_usePluginId,
  useRealtime,
  useSettings,
} from "@get-bb/plugin-sdk/app";

import {
  DESKTOP_LAYOUT_CHANNEL,
  DESKTOP_LAYOUT_EVENT,
  DESKTOP_LAYOUT_SETTING,
  writeDesktopLayoutEnabled,
} from "./lib/desktop-layout";
import { injectSidebarDepth } from "./lib/sidebar-depth";
import { SIDEBAR_CHROME_EVENT, writeSidebarChrome } from "./lib/sidebar-chrome";
import { useDeviceChrome } from "./lib/use-device";

function publishDesktopLayout(pluginId: string, enabled: boolean): void {
  writeDesktopLayoutEnabled(window.localStorage, pluginId, enabled);
  window.dispatchEvent(
    new CustomEvent(DESKTOP_LAYOUT_EVENT, { detail: { pluginId, enabled } }),
  );
}

function DesktopLayoutBridge() {
  const { device, orientation, viewport, hitTarget } = useDeviceChrome();
  const pluginId = experimental_usePluginId();
  const { values, isLoading } = useSettings();
  const enabled = values?.[DESKTOP_LAYOUT_SETTING];
  useEffect(() => {
    writeSidebarChrome(document, { device, orientation, viewport, hitTarget });
    window.dispatchEvent(new Event(SIDEBAR_CHROME_EVENT));
  }, [device, orientation, viewport, hitTarget]);
  useRealtime(DESKTOP_LAYOUT_CHANNEL, (payload) => {
    if (payload === null || typeof payload !== "object") return;
    const next = Reflect.get(payload, "enabled");
    if (typeof next !== "boolean") return;
    publishDesktopLayout(pluginId, next);
  });
  useEffect(() => {
    if (isLoading || typeof enabled !== "boolean") return;
    publishDesktopLayout(pluginId, enabled);
  }, [enabled, isLoading, pluginId]);
  return null;
}

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "sidebar-depth",
    mount(context) {
      return injectSidebarDepth(document, { pluginId: context.pluginId });
    },
  });
  app.slots.experimental_appOverlay({
    id: "desktop-layout",
    component: DesktopLayoutBridge,
  });
});
