import { describe, it, expect } from 'vitest';
import { highlightMatches } from '$lib/utils/highlight';

describe('highlightMatches', () => {
	it('쿼리가 비어있으면 전체 텍스트를 text 타입으로 반환한다', () => {
		const result = highlightMatches('hello world', '');
		expect(result).toEqual([{ type: 'text', value: 'hello world' }]);
	});

	it('매칭되는 부분을 highlight 타입으로 분리한다', () => {
		const result = highlightMatches('hello world', 'world');
		expect(result).toEqual([
			{ type: 'text', value: 'hello ' },
			{ type: 'highlight', value: 'world' }
		]);
	});

	it('대소문자 구분 없이 매칭한다', () => {
		const result = highlightMatches('Hello World', 'hello');
		expect(result).toEqual([
			{ type: 'highlight', value: 'Hello' },
			{ type: 'text', value: ' World' }
		]);
	});

	it('여러 매칭을 모두 분리한다', () => {
		const result = highlightMatches('abc def abc', 'abc');
		expect(result).toEqual([
			{ type: 'highlight', value: 'abc' },
			{ type: 'text', value: ' def ' },
			{ type: 'highlight', value: 'abc' }
		]);
	});

	it('매칭이 없으면 전체 텍스트를 text 타입으로 반환한다', () => {
		const result = highlightMatches('hello world', 'xyz');
		expect(result).toEqual([{ type: 'text', value: 'hello world' }]);
	});

	it('텍스트가 비어있으면 빈 배열을 반환한다', () => {
		const result = highlightMatches('', 'test');
		expect(result).toEqual([]);
	});

	it('정규식 특수문자를 이스케이프 처리한다', () => {
		const result = highlightMatches('price is $10.00', '$10.00');
		expect(result).toEqual([
			{ type: 'text', value: 'price is ' },
			{ type: 'highlight', value: '$10.00' }
		]);
	});

	it('HTML 특수문자가 포함된 텍스트를 안전하게 처리한다', () => {
		const result = highlightMatches('<script>alert("xss")</script>', 'script');
		expect(result).toEqual([
			{ type: 'text', value: '<' },
			{ type: 'highlight', value: 'script' },
			{ type: 'text', value: '>alert("xss")</' },
			{ type: 'highlight', value: 'script' },
			{ type: 'text', value: '>' }
		]);
	});
});
