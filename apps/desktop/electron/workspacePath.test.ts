import { expect, test } from "bun:test";
import os from "node:os";
import path from "node:path";
import { resolveWorkspacePath } from "./workspacePath.js";

test("expands the home directory shorthand", () => {
	expect(resolveWorkspacePath("~")).toBe(path.resolve(os.homedir()));
});

test("resolves relative workspace paths", () => {
	expect(resolveWorkspacePath(".")).toBe(process.cwd());
});

test("rejects missing workspace directories", () => {
	const missing = path.join(os.tmpdir(), `omnia-missing-${crypto.randomUUID()}`);
	expect(() => resolveWorkspacePath(missing)).toThrow(
		`Workspace directory does not exist: ${missing}`,
	);
});
