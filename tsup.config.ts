import { defineConfig } from "tsup";
import pkg from "./apps/desktop/package.json";

const desktopDeps = Object.keys(pkg.dependencies || {}).filter(
  (dep) => !dep.startsWith("@omnia/"),
);

export default defineConfig([
  {
    entry: {
      "electron/main": "apps/desktop/electron/main.ts",
    },
    outDir: "dist-electron/apps/desktop",
    format: ["esm"],
    platform: "node",
    external: ["electron", "node:crypto", ...desktopDeps],
    noExternal: [/^@omnia\//],
    clean: true,
  },
  {
    entry: {
      "preload/preload": "apps/desktop/preload/preload.cts",
    },
    outDir: "dist-electron/apps/desktop",
    format: ["cjs"],
    platform: "node",
    external: ["electron", ...desktopDeps],
    noExternal: [/^@omnia\//],
    clean: false,
  },
]);
