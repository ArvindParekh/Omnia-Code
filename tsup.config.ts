import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";
import pkg from "./apps/desktop/package.json";

const desktopDeps = Object.keys(pkg.dependencies || {}).filter((dep) => !dep.startsWith("@omnia/"));

const MAIN_BUNDLE = "dist-electron/apps/desktop/electron/main.js";

export default defineConfig([
	{
		entry: {
			"electron/main": "apps/desktop/electron/main.ts",
		},
		outDir: "dist-electron/apps/desktop",
		format: ["esm"],
		platform: "node",
		// Keep node: prefixes. tsup strips them by default, and Node only
		// resolves sqlite with the prefix — a bare "sqlite" looks like npm.
		removeNodeProtocol: false,
		external: ["electron", "node:crypto", "node:sqlite", ...desktopDeps],
		noExternal: [/^@omnia\//],
		clean: true,
		async onSuccess() {
			// esbuild still emits a bare "sqlite" specifier for this builtin.
			const src = readFileSync(MAIN_BUNDLE, "utf8");
			const next = src.replace(/(from\s+|import\s*\(\s*)(["'])sqlite\2/g, "$1$2node:sqlite$2");
			if (next !== src) writeFileSync(MAIN_BUNDLE, next);
		},
	},
	{
		entry: {
			"preload/preload": "apps/desktop/preload/preload.cts",
		},
		outDir: "dist-electron/apps/desktop",
		format: ["cjs"],
		platform: "node",
		removeNodeProtocol: false,
		external: ["electron", ...desktopDeps],
		noExternal: [/^@omnia\//],
		clean: false,
	},
]);
