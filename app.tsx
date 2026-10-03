import { definePluginApp } from "@get-bb/plugin-sdk/app";

import { injectSidebarDepth } from "./lib/sidebar-depth";

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "sidebar-depth",
    mount() {
      return injectSidebarDepth(document);
    },
  });
});
