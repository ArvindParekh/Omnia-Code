export function workspaceName(workspacePath: string): string {
	return workspacePath.replace(/^.*\//, "") || workspacePath;
}
