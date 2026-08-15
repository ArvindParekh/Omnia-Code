// Picks the single most relevant argument to show as a tool call's headline
// (the file path for file tools, the command for shell tools), falling back
// to the raw args when neither is present.
export function getToolPrimaryArg(input: Record<string, unknown>): string {
	return (input.path as string) ?? (input.command as string) ?? JSON.stringify(input);
}
