export function timeAgo(date: Date): string {
	const now = Date.now();
	const diff = now - date.getTime();
	const secs = Math.floor(diff / 1000);
	const mins = Math.floor(secs / 60);
	const hours = Math.floor(mins / 60);

	if (secs < 60) return "now";
	if (mins < 60) return `${mins}m`;
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}
