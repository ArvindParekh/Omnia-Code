import { BrowserWindow, dialog } from "electron";
import { ipcMainHandle } from "../util.js";
import { resolveWorkspacePath } from "../workspacePath.js";

ipcMainHandle<"app:pickWorkspace">("app:pickWorkspace", async (event) => {
	const window = BrowserWindow.fromWebContents(event.sender);
	const result = window
		? await dialog.showOpenDialog(window, {
				properties: ["openDirectory"],
			})
		: await dialog.showOpenDialog({ properties: ["openDirectory"] });
	const { canceled, filePaths } = result;
	if (canceled || !filePaths[0]) return null;
	return resolveWorkspacePath(filePaths[0]);
});
