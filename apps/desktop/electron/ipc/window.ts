import { BrowserWindow } from "electron";
import { ipcMainHandle } from "../util.js";

function getWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
	return BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0] ?? null;
}

ipcMainHandle<"window:minimize">("window:minimize", (event) => {
	getWindow(event)?.minimize();
	return undefined;
});

ipcMainHandle<"window:maximize">("window:maximize", (event) => {
	const win = getWindow(event);
	if (win?.isMaximized()) win.unmaximize();
	else win?.maximize();
	return undefined;
});

ipcMainHandle<"window:close">("window:close", (event) => {
	getWindow(event)?.close();
	return undefined;
});
