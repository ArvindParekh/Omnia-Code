import { ipcMain, WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";
import dotenv from "dotenv";

dotenv.config();

export function isDev(): boolean {
    return process.env.NODE_ENV == "development";
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(key: Key, handler: () => EventPayloadMapping[Key]) {
    ipcMain.handle(key, (event) => {
        if (event.senderFrame) validateSender(event.senderFrame);
        return handler();
    });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(key: Key, webContents: WebContents, payload: EventPayloadMapping[Key]) {
    webContents.send(key, payload);
}

function validateSender(frame: WebFrameMain) {
    const port = process.env.PORT;
    if (isDev() && new URL(frame.url).host === `localhost:${port}`) return;
    if (frame.url !== pathToFileURL(getUIPath()).toString()) throw new Error("Malicious event");
}
