import { ipcMain, WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";
import dotenv from "dotenv";
import type { IpcChannels, IpcEvents } from "../../../packages/contracts/types.js";

dotenv.config();

export function isDev(): boolean {
  return process.env.NODE_ENV == "development";
}

export function ipcMainHandle<Key extends keyof IpcChannels>(
  key: Key,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    args: IpcChannels[Key]["args"],
  ) => IpcChannels[Key]["result"],
) {
  ipcMain.handle(key, (event, args) => {
    if (event.senderFrame) validateSender(event.senderFrame);
    return handler(event, args);
  });
}

export function ipcWebContentsSend<Key extends keyof IpcEvents>(
  key: Key,
  webContents: WebContents,
  payload: IpcEvents[Key],
) {
  webContents.send(key, payload);
}

function validateSender(frame: WebFrameMain) {
  const port = process.env.PORT;
  if (isDev() && new URL(frame.url).host === `localhost:${port}`) return;
  if (frame.url !== pathToFileURL(getUIPath()).toString())
    throw new Error("Malicious event");
}
