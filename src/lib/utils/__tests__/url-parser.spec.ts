import { describe, it, expect } from 'vitest';
import { parseUrls, type TextSegment } from '../url-parser';

describe('parseUrls', () => {
	describe('기본 URL 감지', () => {
		it('https:// URL을 감지하여 세그먼트로 분리한다', () => {
			const result = parseUrls('안녕 https://example.com 확인해봐');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '안녕 ' },
				{ type: 'url', value: 'https://example.com' },
				{ type: 'text', value: ' 확인해봐' }
			]);
		});

		it('http:// URL을 감지한다', () => {
			const result = parseUrls('링크: http://example.com/page');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '링크: ' },
				{ type: 'url', value: 'http://example.com/page' }
			]);
		});

		it('www. 으로 시작하는 URL을 감지한다', () => {
			const result = parseUrls('방문해봐 www.example.com');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '방문해봐 ' },
				{ type: 'url', value: 'www.example.com' }
			]);
		});
	});

	describe('복잡한 URL 패턴', () => {
		it('경로와 쿼리 파라미터가 포함된 URL을 감지한다', () => {
			const result = parseUrls('여기 https://example.com/path?q=test&page=1#section 참고');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '여기 ' },
				{ type: 'url', value: 'https://example.com/path?q=test&page=1#section' },
				{ type: 'text', value: ' 참고' }
			]);
		});

		it('연속된 URL을 각각 분리한다', () => {
			const result = parseUrls('https://a.com https://b.com');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'url', value: 'https://a.com' },
				{ type: 'text', value: ' ' },
				{ type: 'url', value: 'https://b.com' }
			]);
		});
	});

	describe('엣지 케이스', () => {
		it('괄호 내 URL에서 닫는 괄호를 URL에 포함하지 않는다', () => {
			const result = parseUrls('(https://example.com)');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '(' },
				{ type: 'url', value: 'https://example.com' },
				{ type: 'text', value: ')' }
			]);
		});

		it('URL 뒤 마침표를 URL에 포함하지 않는다', () => {
			const result = parseUrls('확인: https://example.com.');

			expect(result).toEqual<TextSegment[]>([
				{ type: 'text', value: '확인: ' },
				{ type: 'url', value: 'https://example.com' },
				{ type: 'text', value: '.' }
			]);
		});

		it('URL이 없는 텍스트는 텍스트 세그먼트 하나만 반환한다', () => {
			const result = parseUrls('일반 텍스트입니다');

			expect(result).toEqual<TextSegment[]>([{ type: 'text', value: '일반 텍스트입니다' }]);
		});

		it('빈 문자열은 빈 배열을 반환한다', () => {
			const result = parseUrls('');

			expect(result).toEqual<TextSegment[]>([]);
		});

		it('URL만 있는 텍스트는 URL 세그먼트 하나만 반환한다', () => {
			const result = parseUrls('https://example.com');

			expect(result).toEqual<TextSegment[]>([{ type: 'url', value: 'https://example.com' }]);
		});
	});
});
