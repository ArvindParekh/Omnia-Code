import path from "path";
import { app } from "electron";

// dist-electron/dist-react/templateIcon.png are packed inside app.asar
// alongside package.json (see electron-builder.json "files"), so both dev
// and packaged builds resolve them the same way, relative to the app root.
export function getPreloadPath() {
	return path.join(app.getAppPath(), "dist-electron/apps/desktop/preload/preload.cjs");
}

export function getUIPath() {
	return path.join(app.getAppPath(), "/dist-react/index.html");
}

export function getIconPath() {
	return path.join(app.getAppPath(), "templateIcon.png");
}
