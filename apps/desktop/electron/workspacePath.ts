import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function resolveWorkspacePath(input: string): string {
	const value = input.trim();
	if (!value) throw new Error("Workspace path is required");

	const expanded =
		value === "~"
			? os.homedir()
			: value.startsWith("~/")
				? path.join(os.homedir(), value.slice(2))
				: value;
	const resolved = path.resolve(expanded);

	let stat: fs.Stats;
	try {
		stat = fs.statSync(resolved);
	} catch {
		throw new Error(`Workspace directory does not exist: ${resolved}`);
	}

	if (!stat.isDirectory()) {
		throw new Error(`Workspace path is not a directory: ${resolved}`);
	}

	return fs.realpathSync(resolved);
}
