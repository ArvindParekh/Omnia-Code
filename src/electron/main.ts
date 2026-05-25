import { app, BrowserWindow } from "electron"
import { isDev } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
if (!PORT && isDev()) throw new Error("PORT env variable is not set");

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath()
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${PORT}`)
    else mainWindow.loadFile(getUIPath());
})
