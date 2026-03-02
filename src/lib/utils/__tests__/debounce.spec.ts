import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../debounce';

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('delay 이후에 함수를 한 번만 실행한다', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 300);

		debouncedFn();
		debouncedFn();
		debouncedFn();

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledOnce();
	});

	it('호출 사이에 새로운 호출이 들어오면 타이머를 리셋한다', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 300);

		debouncedFn();
		vi.advanceTimersByTime(100);
		debouncedFn();
		vi.advanceTimersByTime(100);
		debouncedFn();
		vi.advanceTimersByTime(100);

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledOnce();
	});

	it('cancel() 호출 시 대기 중인 함수를 취소한다', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 300);

		debouncedFn();
		debouncedFn.cancel();
		vi.advanceTimersByTime(300);

		expect(fn).not.toHaveBeenCalled();
	});

	it('함수에 전달된 인수를 그대로 전달한다', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 300);

		debouncedFn('arg1', 'arg2');
		vi.advanceTimersByTime(300);

		expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
	});

	it('마지막 호출의 인수로만 함수를 실행한다', () => {
		const fn = vi.fn();
		const debouncedFn = debounce(fn, 300);

		debouncedFn('first');
		debouncedFn('second');
		debouncedFn('third');

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledWith('third');
		expect(fn).toHaveBeenCalledOnce();
	});
});
