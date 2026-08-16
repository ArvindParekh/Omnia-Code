export type FileEdit = {
	filePath: string;
	before: string;
	after: string;
};

export type ShellCommand = {
	command: string;
	description?: string;
};

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function filePathOf(args: Record<string, unknown>): string | undefined {
	return asString(args.file_path) ?? asString(args.notebook_path) ?? asString(args.path);
}

export function parseFileEdit(toolName: string, args: Record<string, unknown>): FileEdit | null {
	const filePath = filePathOf(args);
	if (!filePath) return null;

	switch (toolName) {
		case "Edit":
		case "NotebookEdit": {
			const before = asString(args.old_string) ?? asString(args.old_source);
			const after = asString(args.new_string) ?? asString(args.new_source);
			if (before === undefined || after === undefined) return null;
			return { filePath, before, after };
		}
		case "Write": {
			const after = asString(args.content);
			if (after === undefined) return null;
			return { filePath, before: "", after };
		}
		default:
			return null;
	}
}

export function parseShellCommand(args: Record<string, unknown>): ShellCommand | null {
	const command = asString(args.command);
	if (!command) return null;
	return { command, description: asString(args.description) };
}

export function describeLookup(toolName: string, args: Record<string, unknown>): string | null {
	switch (toolName) {
		case "Read": {
			const filePath = filePathOf(args);
			if (!filePath) return null;

			const offset = asNumber(args.offset);
			const limit = asNumber(args.limit);
			if (offset !== undefined && limit !== undefined) {
				return `${filePath}:${offset}-${offset + limit}`;
			}
			return filePath;
		}
		case "Grep": {
			const pattern = asString(args.pattern);
			if (!pattern) return null;

			const scope = asString(args.path) ?? asString(args.glob);
			return scope ? `${pattern}  in ${scope}` : pattern;
		}
		case "Glob": {
			const pattern = asString(args.pattern);
			if (!pattern) return null;

			const scope = asString(args.path);
			return scope ? `${pattern}  in ${scope}` : pattern;
		}
		default:
			return null;
	}
}

export function stringifyToolOutput(output: unknown): string {
	if (output == null) return "";
	if (typeof output === "string") return output;

	if (Array.isArray(output)) {
		return output
			.map((block) => {
				if (typeof block === "string") return block;
				if (block && typeof block === "object" && "text" in block) {
					return asString((block as { text: unknown }).text) ?? "";
				}
				return "";
			})
			.join("");
	}

	if (typeof output === "object" && "output" in output) {
		return stringifyToolOutput((output as { output: unknown }).output);
	}

	return JSON.stringify(output, null, 2);
}

const EXTENSION_LANGUAGES: Record<string, string> = {
	ts: "typescript",
	tsx: "tsx",
	mts: "typescript",
	cts: "typescript",
	js: "javascript",
	jsx: "jsx",
	mjs: "javascript",
	cjs: "javascript",
	json: "json",
	jsonc: "jsonc",
	md: "markdown",
	mdx: "mdx",
	css: "css",
	scss: "scss",
	html: "html",
	py: "python",
	rb: "ruby",
	go: "go",
	rs: "rust",
	java: "java",
	kt: "kotlin",
	swift: "swift",
	c: "c",
	h: "c",
	cpp: "cpp",
	hpp: "cpp",
	cs: "csharp",
	php: "php",
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	fish: "fish",
	sql: "sql",
	yml: "yaml",
	yaml: "yaml",
	toml: "toml",
	xml: "xml",
	svelte: "svelte",
	vue: "vue",
	prisma: "prisma",
	graphql: "graphql",
	dockerfile: "docker",
};

export function languageFromPath(filePath: string): string {
	const name = filePath.split(/[\\/]/).pop() ?? "";
	if (name.toLowerCase() === "dockerfile") return "docker";

	const extension = name.includes(".") ? (name.split(".").pop() ?? "") : "";
	return EXTENSION_LANGUAGES[extension.toLowerCase()] ?? "text";
}

export function splitPath(filePath: string): { directory: string; name: string } {
	const separator = filePath.lastIndexOf("/");
	if (separator === -1) return { directory: "", name: filePath };
	return {
		directory: filePath.slice(0, separator + 1),
		name: filePath.slice(separator + 1),
	};
}
