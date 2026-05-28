import { app, BrowserWindow } from "electron";
import { isDev } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import "./ipc/ai.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
if (!PORT && isDev()) throw new Error("PORT env variable is not set");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    frame: false,
    title: "Journal",
    webPreferences: {
      preload: getPreloadPath(),
    },
    icon: getIconPath(),
  });

  if (isDev()) mainWindow.loadURL(`http://localhost:${PORT}`);
  else mainWindow.loadFile(getUIPath());
};

app.on("ready", () => {
  createWindow();
});
