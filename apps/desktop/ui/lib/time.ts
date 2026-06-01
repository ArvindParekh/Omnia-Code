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
