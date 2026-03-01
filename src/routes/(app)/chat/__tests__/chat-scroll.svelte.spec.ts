import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import ScrollTestWrapper from './ScrollTestWrapper.svelte';

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
