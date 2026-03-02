import { render } from 'vitest-browser-svelte';
import { describe, it, expect, vi } from 'vitest';
import ScrollTestWrapper from './ScrollTestWrapper.svelte';
import type { AutoScrollCallbacks } from '$lib/chat/auto-scroll';

function getContainer(screen: ReturnType<typeof render>) {
	return screen.container.querySelector('[data-testid="scroll-container"]') as HTMLElement;
}

function generateItems(count: number): string[] {
	return Array.from({ length: count }, (_, i) => `메시지 ${i + 1}`);
}

async function tick() {
	await new Promise((r) => setTimeout(r, 50));
}

describe('autoScroll — 초기 렌더링', () => {
	it('콘텐츠가 컨테이너보다 클 때 최하단으로 스크롤된다', async () => {
		const items = generateItems(20);
		const screen = render(ScrollTestWrapper, { props: { items } });
		const container = getContainer(screen);

		await tick();

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 5;
		expect(isAtBottom).toBe(true);
	});
});

describe('autoScroll — 새 메시지 추가', () => {
	it('하단에 있을 때 새 메시지가 추가되면 자동 스크롤된다', async () => {
		const items = generateItems(20);
		const screen = render(ScrollTestWrapper, { props: { items } });
		const container = getContainer(screen);
		await tick();

		// 새 메시지 추가
		items.push('새 메시지');
		await tick();

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 5;
		expect(isAtBottom).toBe(true);
	});
});

describe('autoScroll — 사용자 스크롤 감지', () => {
	it('사용자가 위로 스크롤하면 자동 스크롤이 비활성화된다', async () => {
		const items = generateItems(20);
		const screen = render(ScrollTestWrapper, { props: { items } });
		const container = getContainer(screen);
		await tick();

		// 사용자가 위로 스크롤
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 새 메시지 추가
		items.push('새 메시지 (스크롤 유지)');
		await tick();

		// 위로 스크롤한 상태 유지 (자동 스크롤 비활성화)
		expect(container.scrollTop).toBeLessThan(container.scrollHeight - container.clientHeight - 50);
	});

	it('사용자가 다시 하단으로 스크롤하면 자동 스크롤이 재활성화된다', async () => {
		const items = generateItems(20);
		const screen = render(ScrollTestWrapper, { props: { items } });
		const container = getContainer(screen);
		await tick();

		// 위로 스크롤
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 다시 하단으로 스크롤
		container.scrollTop = container.scrollHeight - container.clientHeight;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 새 메시지 추가
		items.push('새 메시지 (자동 스크롤 복귀)');
		await tick();

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 5;
		expect(isAtBottom).toBe(true);
	});
});

describe('autoScroll — 콜백', () => {
	it('onReady로 scrollToBottom 함수를 수신한다', async () => {
		const items = generateItems(20);
		let receivedApi: { scrollToBottom: () => void } | undefined;
		const callbacks: AutoScrollCallbacks = {
			onReady: (api) => {
				receivedApi = api;
			}
		};
		render(ScrollTestWrapper, { props: { items, callbacks } });
		await tick();

		expect(receivedApi?.scrollToBottom).toBeTypeOf('function');
	});

	it('onReady로 받은 scrollToBottom을 외부에서 호출할 수 있다', async () => {
		const items = generateItems(20);
		let scrollToBottom: (() => void) | undefined;
		const callbacks: AutoScrollCallbacks = {
			onReady: (api) => {
				scrollToBottom = api.scrollToBottom;
			}
		};
		const screen = render(ScrollTestWrapper, { props: { items, callbacks } });
		const container = getContainer(screen);
		await tick();

		// 위로 스크롤
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 외부에서 scrollToBottom 호출
		expect(scrollToBottom).toBeDefined();
		scrollToBottom?.();
		await tick();

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 5;
		expect(isAtBottom).toBe(true);
	});

	it('스크롤 위로 이동 시 onAtBottomChange(false) 호출', async () => {
		const items = generateItems(20);
		const onAtBottomChange = vi.fn();
		const callbacks: AutoScrollCallbacks = { onAtBottomChange };
		const screen = render(ScrollTestWrapper, { props: { items, callbacks } });
		const container = getContainer(screen);
		await tick();

		// 위로 스크롤
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		expect(onAtBottomChange).toHaveBeenCalledWith(false);
	});

	it('하단 복귀 시 onAtBottomChange(true) 호출', async () => {
		const items = generateItems(20);
		const onAtBottomChange = vi.fn();
		const callbacks: AutoScrollCallbacks = { onAtBottomChange };
		const screen = render(ScrollTestWrapper, { props: { items, callbacks } });
		const container = getContainer(screen);
		await tick();

		// 위로 스크롤
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 하단으로 복귀
		container.scrollTop = container.scrollHeight - container.clientHeight;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		expect(onAtBottomChange).toHaveBeenCalledWith(true);
	});

	it('상태 미변경 시 콜백이 반복 호출되지 않는다', async () => {
		const items = generateItems(20);
		const onAtBottomChange = vi.fn();
		const callbacks: AutoScrollCallbacks = { onAtBottomChange };
		const screen = render(ScrollTestWrapper, { props: { items, callbacks } });
		const container = getContainer(screen);
		await tick();

		// 위로 스크롤 (false 전이)
		container.scrollTop = 0;
		container.dispatchEvent(new Event('scroll'));
		await tick();

		// 같은 위치에서 다시 스크롤 이벤트 (상태 미변경)
		container.dispatchEvent(new Event('scroll'));
		await tick();

		const falseCalls = onAtBottomChange.mock.calls.filter((call: unknown[]) => call[0] === false);
		expect(falseCalls).toHaveLength(1);
	});
});
