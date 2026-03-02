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

	test('채팅방 나가기 → 사이드바에서 제거', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'leave-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'leave-b');

		await createRoomWith(pageA, userB.name);

		// 홈으로 이동
		await pageA.goto('/');
		await pageA.waitForLoadState('networkidle');

		// 사이드바에 방이 보이는지 확인
		const roomItem = pageA.getByText(userB.name).first();
		await expect(roomItem).toBeVisible();

		// confirm 다이얼로그 자동 수락 등록
		pageA.on('dialog', (d) => d.accept());

		// hover → 나가기 버튼 visible → 클릭
		const roomRow = pageA.locator('.group').filter({ hasText: userB.name });
		await roomRow.hover();
		await roomRow.getByRole('button', { name: '채팅방 나가기' }).click();

		// 사이드바에서 방이 제거됨
		await expect(roomItem).not.toBeVisible({ timeout: 5000 });

		await ctxA.close();
		await ctxB.close();
	});

	test('채팅방 삭제 → 상대방에게 실시간 삭제 배너 표시', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'del-a');
		const {
			context: ctxB,
			page: pageB,
			user: userB
		} = await createAuthenticatedContext(browser, 'del-b');

		const roomId = await createRoomWith(pageA, userB.name);

		// B가 방에 접속 (소켓 연결 필요)
		await pageB.goto(`/chat/${roomId}`);
		await pageB.getByPlaceholder('메시지를 입력하세요').waitFor({ timeout: 5000 });

		// A가 홈으로 가서 삭제
		await pageA.goto('/');
		await pageA.waitForLoadState('networkidle');

		pageA.on('dialog', (d) => d.accept());

		// hover → 삭제 버튼 visible → 클릭
		const roomRow = pageA.locator('.group').filter({ hasText: userB.name });
		await roomRow.hover();
		await roomRow.getByRole('button', { name: '채팅방 삭제' }).click();

		// B가 방에 있는 상태에서 소켓으로 삭제 이벤트 수신 → 배너 표시
		await expect(pageB.getByText('이 채팅방이 삭제되었습니다.')).toBeVisible({ timeout: 8000 });

		// 입력 필드가 비활성화
		await expect(pageB.getByPlaceholder('메시지를 입력하세요')).toBeDisabled();

		await ctxA.close();
		await ctxB.close();
	});

	test('상대방 나가기 → 나간 방 배너 + 입력 비활성화', async ({ browser }) => {
		const {
			context: ctxA,
			page: pageA,
			user: userA
		} = await createAuthenticatedContext(browser, 'left-a');
		const {
			context: ctxB,
			page: pageB,
			user: userB
		} = await createAuthenticatedContext(browser, 'left-b');

		const roomId = await createRoomWith(pageA, userB.name);

		// A가 방에 접속 상태 유지 (소켓으로 나감 이벤트 수신)
		await pageA.getByPlaceholder('메시지를 입력하세요').waitFor({ timeout: 5000 });

		// B가 방에 접속했다가 홈으로 이동
		await pageB.goto(`/chat/${roomId}`);
		await pageB.goto('/');
		await pageB.waitForLoadState('networkidle');

		// B가 나가기 (사이드바에는 A의 이름이 표시됨)
		pageB.on('dialog', (d) => d.accept());
		const roomRow = pageB.locator('.group').filter({ hasText: userA.name });
		await roomRow.hover();
		await roomRow.getByRole('button', { name: '채팅방 나가기' }).click();

		// A가 방에 있는 상태에서 소켓으로 나감 이벤트 수신 → 배너 표시
		await expect(pageA.getByText('상대방이 채팅방에서 나갔습니다.')).toBeVisible({ timeout: 8000 });

		// 입력 필드가 비활성화
		await expect(pageA.getByPlaceholder('메시지를 입력하세요')).toBeDisabled();

		await ctxA.close();
		await ctxB.close();
	});
});
