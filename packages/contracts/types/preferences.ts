import type { EffortLevel } from "./provider.js";

export type Preferences = {
	recentWorkspaces: string[];
	modelId: string | null;
	effort: EffortLevel | null;
};

export const RECENT_WORKSPACES_LIMIT = 8;

export const DEFAULT_PREFERENCES: Preferences = {
	recentWorkspaces: [],
	modelId: null,
	effort: null,
};
