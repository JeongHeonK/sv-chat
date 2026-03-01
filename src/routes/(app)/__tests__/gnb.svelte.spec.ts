import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import Gnb from '$lib/components/gnb.svelte';

describe('GNB — 렌더링', () => {
	it('상단바(header)를 렌더링한다', async () => {
		const screen = render(Gnb);

		await expect.element(screen.getByRole('banner')).toBeVisible();
	});

	it('앱 이름 "sv-chat"을 표시한다', async () => {
		const screen = render(Gnb);

		await expect.element(screen.getByText('sv-chat')).toBeVisible();
	});

	it('로그아웃 버튼을 표시한다', async () => {
		const screen = render(Gnb);

		await expect.element(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
	});

	it('사용자 이름을 표시한다', async () => {
		const screen = render(Gnb, { props: { userName: '홍길동' } });

		await expect.element(screen.getByText('홍길동')).toBeVisible();
	});

	it('userName 미전달 시 이름을 표시하지 않는다', async () => {
		const screen = render(Gnb);

		await expect.element(screen.getByText('홍길동')).not.toBeInTheDocument();
	});
});
