export interface TextSegment {
	type: 'text' | 'url';
	value: string;
}

/**
 * URL 패턴 정규식
 * - http:// 또는 https:// 프로토콜
 * - www. 으로 시작하는 URL (프로토콜 없음)
 * - 경로, 쿼리, 프래그먼트 포함
 */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'()]+/gi;

/** URL 끝에 붙은 구두점 제거 (마침표, 쉼표, 세미콜론, 콜론, 느낌표, 물음표) */
function trimTrailingPunctuation(url: string): string {
	return url.replace(/[.,;:!?]+$/, '');
}

export function parseUrls(text: string): TextSegment[] {
	if (text === '') return [];

	const segments: TextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(URL_PATTERN)) {
		const matchStart = match.index;
		const rawUrl = trimTrailingPunctuation(match[0]);
		const matchEnd = matchStart + rawUrl.length;

		// URL 앞 텍스트
		if (matchStart > lastIndex) {
			segments.push({ type: 'text', value: text.slice(lastIndex, matchStart) });
		}

		segments.push({ type: 'url', value: rawUrl });
		lastIndex = matchEnd;
	}

	// 남은 텍스트
	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return segments;
}
