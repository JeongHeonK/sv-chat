import { test, expect } from '@playwright/test';
import { createAuthenticatedContext } from './fixtures/auth';
import { createRoomWith, sendMessage } from './fixtures/chat';

test.describe('안읽음 뱃지', () => {
	test('다른 방에 있을 때 메시지 수신 시 뱃지 증가', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'unread-a');
		const { context: ctxB, page: pageB, user: userB } = await createAuthenticatedContext(
			browser,
			'unread-b'
		);

		// A가 B와 방 생성
		const roomId = await createRoomWith(pageA, userB.name);

		// B도 방에 접속했다가 홈으로 나감 (다른 곳에 있음)
		await pageB.goto(`/chat/${roomId}`);
		await pageB.goto('/');

		// A가 메시지 전송
		const message = `안읽은 메시지 ${Date.now()}`;
		await sendMessage(pageA, message);

		// B의 사이드바에 안읽음 뱃지가 표시되어야 함
		await expect(pageB.locator('[data-unread-badge]')).toBeVisible({ timeout: 5000 });

		await ctxA.close();
		await ctxB.close();
	});

	test('방 입장 시 뱃지 초기화', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'read-a');
		const { context: ctxB, page: pageB, user: userB } = await createAuthenticatedContext(
			browser,
			'read-b'
		);

		// A가 B와 방 생성 후 메시지 전송
		const roomId = await createRoomWith(pageA, userB.name);
		await pageB.goto('/'); // B는 홈에 있음

		const message = `읽기전 메시지 ${Date.now()}`;
		await sendMessage(pageA, message);

		// B의 뱃지가 표시될 때까지 대기
		await expect(pageB.locator('[data-unread-badge]')).toBeVisible({ timeout: 5000 });

		// B가 방에 입장
		await pageB.goto(`/chat/${roomId}`);

		// 뱃지가 사라져야 함
		await expect(pageB.locator('[data-unread-badge]')).not.toBeVisible({ timeout: 5000 });

		await ctxA.close();
		await ctxB.close();
	});
});
