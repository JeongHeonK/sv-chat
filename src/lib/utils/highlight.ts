export interface HighlightSegment {
	type: 'text' | 'highlight';
	value: string;
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatches(text: string, query: string): HighlightSegment[] {
	if (!text) return [];
	if (!query) return [{ type: 'text', value: text }];

	const pattern = new RegExp(`(${escapeRegExp(query)})`, 'gi');
	const segments: HighlightSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(pattern)) {
		const matchIndex = match.index;
		if (matchIndex > lastIndex) {
			segments.push({ type: 'text', value: text.slice(lastIndex, matchIndex) });
		}
		segments.push({ type: 'highlight', value: match[0] });
		lastIndex = matchIndex + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}
