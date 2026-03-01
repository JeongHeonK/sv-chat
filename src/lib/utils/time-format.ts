export function formatMessageTime(isoString: string): string {
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return '';
	const hours = date.getHours();
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
}

export function formatRelativeTime(date: Date | null): string {
	if (!date) return '';

	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

	if (diffMinutes < 1) return '방금';
	if (diffMinutes < 60) return `${diffMinutes}분 전`;
	if (diffHours < 24) return `${diffHours}시간 전`;

	return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}
