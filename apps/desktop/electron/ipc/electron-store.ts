import { DEFAULT_PREFERENCES, RECENT_WORKSPACES_LIMIT } from "@omnia/contracts";
import type { Preferences } from "@omnia/contracts";
import Store from "electron-store";
import { ipcMainHandle } from "../util.js";

const store = new Store<Preferences>({ defaults: DEFAULT_PREFERENCES });

ipcMainHandle<"app:getPreferences">("app:getPreferences", () => {
	return { ...DEFAULT_PREFERENCES, ...store.store };
});

ipcMainHandle<"app:setPreferences">("app:setPreferences", async (_event, { values }) => {
	store.set(values);
});

export function rememberWorkspace(workspacePath: string): void {
	const previous = store.get("recentWorkspaces");
	store.set(
		"recentWorkspaces",
		[workspacePath, ...previous.filter((path) => path !== workspacePath)].slice(
			0,
			RECENT_WORKSPACES_LIMIT,
		),
	);
}
