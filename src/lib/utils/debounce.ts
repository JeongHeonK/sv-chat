/**
 * Debounce 함수: 지정된 지연 시간 동안 호출을 지연시키고,
 * 그 사이에 새로운 호출이 들어오면 이전 호출을 취소합니다.
 *
 * @param fn 실행할 함수
 * @param delay 지연 시간 (ms)
 * @returns debounced 함수 + cancel 메서드
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): {
	(...args: Parameters<T>): void;
	cancel: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const debounced = (...args: Parameters<T>) => {
		if (timeoutId !== null) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, delay);
	};

	debounced.cancel = () => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced;
}
