import { contextBridge, ipcRenderer } from "electron";
import type { IpcChannels, IpcEvents } from "../shared/types.js";

const handlers = {
  ipc: {
    invoke: <C extends keyof IpcChannels>(
      channel: C,
      args: IpcChannels[C]["args"],
    ) => ipcRenderer.invoke(channel, args),
  },
  on: <E extends keyof IpcEvents>(
    channel: E,
    callback: (data: IpcEvents[E]) => void,
  ) => {
    const handler = (_: Electron.IpcRendererEvent, data: IpcEvents[E]) =>
      callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
};

contextBridge.exposeInMainWorld("omnia", handlers);

export type Handlers = typeof handlers;
