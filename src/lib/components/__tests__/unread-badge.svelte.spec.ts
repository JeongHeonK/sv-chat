import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import UnreadBadge from '$lib/components/unread-badge.svelte';

describe('UnreadBadge — 렌더링', () => {
	it('count가 0이면 뱃지가 표시되지 않는다', async () => {
		const screen = render(UnreadBadge, { props: { count: 0 } });
		const badge = screen.container.querySelector('[data-unread-badge]');
		expect(badge).toBeNull();
	});

	it('count가 1 이상이면 뱃지가 표시된다', async () => {
		const screen = render(UnreadBadge, { props: { count: 3 } });
		await expect.element(screen.getByText('3')).toBeVisible();
	});

	it('count가 99 이하이면 정확한 숫자를 표시한다', async () => {
		const screen = render(UnreadBadge, { props: { count: 42 } });
		await expect.element(screen.getByText('42')).toBeVisible();
	});

	it('count가 99를 초과하면 "99+"를 표시한다', async () => {
		const screen = render(UnreadBadge, { props: { count: 150 } });
		await expect.element(screen.getByText('99+')).toBeVisible();
	});

	it('aria-label이 올바르게 설정된다', async () => {
		const screen = render(UnreadBadge, { props: { count: 5 } });
		const badge = screen.container.querySelector('[data-unread-badge]');
		expect(badge?.getAttribute('aria-label')).toBe('읽지 않은 메시지 5개');
	});

	it('count가 99를 초과할 때 aria-label에 실제 숫자가 포함된다', async () => {
		const screen = render(UnreadBadge, { props: { count: 150 } });
		const badge = screen.container.querySelector('[data-unread-badge]');
		expect(badge?.getAttribute('aria-label')).toBe('읽지 않은 메시지 150개');
	});
});
