import { twoUserTest as test, expect } from './fixtures/index';
import { sendMessage } from './fixtures/chat';

test.describe('안읽음 뱃지', () => {
	// 참고: 사이드바 unread count는 SSR(서버 렌더링) 기반으로 동작.
	// 실시간 소켓 업데이트가 아닌 페이지 navigate 시 서버에서 재조회됨.

	test('다른 방 이동 후 돌아왔을 때 뱃지 표시', async ({ userA, userB, roomId }) => {
		test.slow(); // 네트워크 지연 대비

		// B도 방에 접속했다가 홈으로 나감
		await userB.page.goto(`/chat/${roomId}`);
		await userB.page.goto('/');

		// A가 메시지 전송
		const message = `안읽은 메시지 ${Date.now()}`;
		await sendMessage(userA.page, message);

		// B가 홈을 재방문하면 뱃지가 표시되어야 함 (SSR 재조회)
		await userB.page.reload();
		await expect(userB.page.locator('[data-unread-badge]')).toBeVisible({ timeout: 5000 });
	});

	test('방 입장 시 뱃지 초기화', async ({ userA, userB, roomId }) => {
		test.slow(); // 네트워크 지연 대비

		// B는 홈에 있음
		await userB.page.goto('/');

		const message = `읽기전 메시지 ${Date.now()}`;
		await sendMessage(userA.page, message);

		// B가 홈 reload → 뱃지 표시 확인
		await userB.page.reload();
		await expect(userB.page.locator('[data-unread-badge]')).toBeVisible({ timeout: 5000 });

		// B가 방에 입장 → lastReadAt 갱신 → 뱃지 초기화
		await userB.page.goto(`/chat/${roomId}`);
		// 채팅방 페이지에서 홈으로 이동 시 layout reload
		await userB.page.goto('/');
		await expect(userB.page.locator('[data-unread-badge]')).not.toBeVisible({ timeout: 5000 });
	});
});
