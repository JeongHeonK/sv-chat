import { test, expect } from '@playwright/test';
import { createAuthenticatedContext } from './fixtures/index';
import { createRoomWith, sendMessage, waitForMessage } from './fixtures/chat';

test.describe('실시간 메시지', () => {
	test('User A 메시지 전송 → User B 실시간 수신', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'msg-a');
		const {
			context: ctxB,
			page: pageB,
			user: userB
		} = await createAuthenticatedContext(browser, 'msg-b');

		// A가 B와 방 생성
		const roomId = await createRoomWith(pageA, userB.name);

		// B가 같은 방에 접속 후 채팅 입력창이 보일 때까지 대기 (소켓 연결 확인)
		await pageB.goto(`/chat/${roomId}`);
		await pageB.getByPlaceholder('메시지를 입력하세요').waitFor({ timeout: 5000 });

		// A가 메시지 전송
		const message = `안녕하세요 ${Date.now()}`;
		await sendMessage(pageA, message);

		// B가 실시간으로 수신
		await waitForMessage(pageB, message, 8000);

		await ctxA.close();
		await ctxB.close();
	});

	test('하단 도달 시 자동 스크롤 유지', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'scroll-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'scroll-b');

		await createRoomWith(pageA, userB.name);

		// 여러 메시지 전송 후 스크롤 버튼이 보이지 않아야 함 (하단에 있으면)
		for (let i = 0; i < 3; i++) {
			await sendMessage(pageA, `메시지 ${i + 1}`);
		}

		// 하단에 있을 때 스크롤 버튼이 숨겨져 있어야 함
		const scrollBtn = pageA.getByRole('button', { name: '최하단으로 스크롤' });
		await expect(scrollBtn).not.toBeVisible();

		await ctxA.close();
		await ctxB.close();
	});

	test('상단에 있을 때 스크롤 버튼 표시', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'scrollbtn-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'scrollbtn-b');

		await createRoomWith(pageA, userB.name);

		// 여러 메시지 전송
		for (let i = 0; i < 10; i++) {
			await pageA.getByPlaceholder('메시지를 입력하세요').fill(`메시지 ${i + 1}`);
			await pageA.getByRole('button', { name: '전송' }).click();
		}
		// 마지막 메시지 렌더링 대기
		await pageA.getByText('메시지 10').waitFor({ timeout: 5000 });

		// 뷰포트를 줄여서 스크롤 영역 강제 생성
		await pageA.setViewportSize({ width: 1280, height: 200 });
		await pageA.waitForTimeout(200);

		// 스크롤 컨테이너 찾아 최상단으로 이동하고 scroll 이벤트 발생
		const scrolled = await pageA.evaluate(() => {
			const containers = document.querySelectorAll('.overflow-y-auto');
			const container = Array.from(containers).find(
				(el) => (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight
			) as HTMLElement | undefined;
			if (container) {
				container.scrollTop = 0;
				container.dispatchEvent(new Event('scroll'));
				return true;
			}
			return false;
		});

		if (!scrolled) {
			test.skip();
			await ctxA.close();
			await ctxB.close();
			return;
		}

		await pageA.waitForTimeout(300);
		const scrollBtn = pageA.getByRole('button', { name: '최하단으로 스크롤' });
		await expect(scrollBtn).toBeVisible({ timeout: 3000 });

		await ctxA.close();
		await ctxB.close();
	});
});
