import electron from "electron";

electron.contextBridge.exposeInMainWorld("omnia", {} satisfies Window['omnia'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(key: Key, payload?: unknown): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, payload);
}

function ipcOn<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
    const cb = (_: Electron.IpcRendererEvent, payload: EventPayloadMapping[Key]) => callback(payload)
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb)
}

// suppress unused warnings until channels are wired up
void ipcInvoke;
void ipcOn;
