import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { IpcChannels, IpcEvents } from "@omnia/contracts";

const handlers = {
	ipc: {
		invoke: <C extends keyof IpcChannels>(channel: C, args: IpcChannels[C]["args"]) =>
			ipcRenderer.invoke(channel, args),
	},
	// electron removed File.path; webUtils is the only way to resolve a picked
	// file to an absolute path, and it is main/preload-only.
	getPathForFile: (file: File) => webUtils.getPathForFile(file),
	on: <E extends keyof IpcEvents>(channel: E, callback: (data: IpcEvents[E]) => void) => {
		const handler = (_: Electron.IpcRendererEvent, data: IpcEvents[E]) => callback(data);
		ipcRenderer.on(channel, handler);
		return () => ipcRenderer.removeListener(channel, handler);
	},
};

contextBridge.exposeInMainWorld("omnia", handlers);

export type Handlers = typeof handlers;
