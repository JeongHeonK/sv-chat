const THRESHOLD = 50;

export interface AutoScrollCallbacks {
	onAtBottomChange?: (isAtBottom: boolean) => void;
	onReady?: (api: { scrollToBottom: () => void }) => void;
}

export function autoScroll(node: HTMLElement, callbacks: AutoScrollCallbacks = {}) {
	let isAtBottom = true;
	let prevIsAtBottom = true;

	function checkAtBottom() {
		const { scrollTop, scrollHeight, clientHeight } = node;
		isAtBottom = scrollHeight - scrollTop - clientHeight < THRESHOLD;

		if (isAtBottom !== prevIsAtBottom) {
			prevIsAtBottom = isAtBottom;
			callbacks.onAtBottomChange?.(isAtBottom);
		}
	}

	function scrollToBottom() {
		node.scrollTop = node.scrollHeight;
	}

	const observer = new MutationObserver(() => {
		if (isAtBottom) {
			scrollToBottom();
		}
	});

	observer.observe(node, { childList: true, subtree: true });
	node.addEventListener('scroll', checkAtBottom);

	// 초기 스크롤
	scrollToBottom();

	// 외부에서 스크롤 제어 가능하도록 API 노출
	callbacks.onReady?.({ scrollToBottom });

	return {
		update(newCallbacks: AutoScrollCallbacks) {
			callbacks = newCallbacks;
		},
		destroy() {
			observer.disconnect();
			node.removeEventListener('scroll', checkAtBottom);
		}
	};
}
