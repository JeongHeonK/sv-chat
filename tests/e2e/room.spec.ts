import { test, expect } from '@playwright/test';
import { createAuthenticatedContext } from './fixtures/auth';
import { createRoomWith } from './fixtures/chat';

test.describe('채팅방 관리', () => {
	test('유저 검색 → 방 생성 → 채팅 페이지 진입', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'room-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'room-b');

		await createRoomWith(pageA, userB.name);
		expect(pageA.url()).toMatch(/\/chat\/.+/);

		await ctxA.close();
		await ctxB.close();
	});

	test('방이 사이드바에 표시됨', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'sidebar-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'sidebar-b');

		await createRoomWith(pageA, userB.name);
		// 사이드바에 상대방 이름이 표시되어야 함
		await expect(pageA.getByText(userB.name).first()).toBeVisible();

		await ctxA.close();
		await ctxB.close();
	});

	test('같은 유저 쌍 → 기존 방 재사용', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'reuse-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'reuse-b');

		// 첫 번째 방 생성
		const roomId1 = await createRoomWith(pageA, userB.name);

		// 홈으로 이동 후 같은 유저로 방 다시 생성
		await pageA.goto('/');
		const roomId2 = await createRoomWith(pageA, userB.name);

		// 같은 방 ID여야 함
		expect(roomId1).toBe(roomId2);

		await ctxA.close();
		await ctxB.close();
	});
});
