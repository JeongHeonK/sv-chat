const THRESHOLD = 50;

export function autoScroll(node: HTMLElement) {
	let isAtBottom = true;

	function checkAtBottom() {
		const { scrollTop, scrollHeight, clientHeight } = node;
		isAtBottom = scrollHeight - scrollTop - clientHeight < THRESHOLD;
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

	return {
		destroy() {
			observer.disconnect();
			node.removeEventListener('scroll', checkAtBottom);
		}
	};
}
