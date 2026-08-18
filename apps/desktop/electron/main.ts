import { app, BrowserWindow, Menu } from "electron";
import { isDev } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { appServer } from "./app-server.js";
import "./ipc/ai.js";
import "./ipc/electron-store.js";
import "./ipc/window.js";
import "./ipc/workspace.js";
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

app.on("ready", async () => {
	Menu.setApplicationMenu(null);
	await appServer.start();
	createWindow();
});
