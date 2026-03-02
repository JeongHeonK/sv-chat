/** ILIKE 패턴에서 와일드카드 특수문자(%, _, \)를 이스케이프한다. */
export function escapeLikePattern(s: string): string {
	return s.replace(/[%_\\]/g, '\\$&');
}
