import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from '../time-format';

describe('formatRelativeTime', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('null이면 빈 문자열을 반환한다', () => {
		expect(formatRelativeTime(null)).toBe('');
	});

	it('1분 이내면 "방금"을 반환한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T10:30:30Z'));
		expect(formatRelativeTime(new Date('2024-03-15T10:30:00Z'))).toBe('방금');
		vi.useRealTimers();
	});

	it('1시간 이내면 "N분 전"을 반환한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T10:30:00Z'));
		expect(formatRelativeTime(new Date('2024-03-15T10:00:00Z'))).toBe('30분 전');
		vi.useRealTimers();
	});

	it('24시간 이내면 "N시간 전"을 반환한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T15:00:00Z'));
		expect(formatRelativeTime(new Date('2024-03-15T10:00:00Z'))).toBe('5시간 전');
		vi.useRealTimers();
	});

	it('24시간 이상이면 날짜를 반환한다', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-20T10:00:00Z'));
		const result = formatRelativeTime(new Date('2024-03-15T10:00:00Z'));
		expect(result).toContain('3월');
		expect(result).toContain('15');
		vi.useRealTimers();
	});
});
