// Accepts both Date objects and epoch timestamps (number) since the Session
// contract uses number for updatedAt while local message timestamps are Dates.
export function timeAgo(date: Date | number): string {
	const ts = typeof date === "number" ? date : date.getTime();
	const diff = Date.now() - ts;
	const secs = Math.floor(diff / 1000);
	const mins = Math.floor(secs / 60);
	const hours = Math.floor(mins / 60);

	if (secs < 60) return "now";
	if (mins < 60) return `${mins}m`;
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

export function clockTime(date: Date | number): string {
	const value = typeof date === "number" ? new Date(date) : date;
	return value.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function elapsed(from: Date | number, to: Date | number): string | null {
	const start = typeof from === "number" ? from : from.getTime();
	const end = typeof to === "number" ? to : to.getTime();
	const ms = end - start;
	if (ms < 1000) return null;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;

	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.round((ms % 60_000) / 1000);
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
