const fs = require("node:fs");
const path = require("node:path");

// .deb and .AppImage are both assembled from this same unpacked output dir,
// and neither format gives us a reliable way to inject --no-sandbox for
// every launch path (desktop file, terminal, AppImageLauncher's binfmt
// bypass) — see git history on apps/desktop/electron/pathResolver.ts for
// the investigation. Renaming the real binary and dropping in a wrapper
// script fixes both packaging formats at once, since AppImage's AppRun and
// the .deb's /usr/bin symlink both just exec whatever file has this name.
module.exports = async function afterPack(context) {
	if (context.electronPlatformName !== "linux") return;

	const executableName = context.packager.executableName;
	const appOutDir = context.appOutDir;
	const realBinaryName = `${executableName}-bin`;

	const wrapperPath = path.join(appOutDir, executableName);
	const realBinaryPath = path.join(appOutDir, realBinaryName);

	fs.renameSync(wrapperPath, realBinaryPath);

	const wrapperScript = `#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/${realBinaryName}" --no-sandbox "$@"
`;
	fs.writeFileSync(wrapperPath, wrapperScript, { mode: 0o755 });
};
