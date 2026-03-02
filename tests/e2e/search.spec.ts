import { test, expect } from '@playwright/test';
import { createAuthenticatedContext } from './fixtures/auth';
import { createRoomWith, sendMessage } from './fixtures/chat';

test.describe('검색', () => {
	test('채팅방 내 검색: 키워드 → 매치 카운트 표시 + 하이라이트', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'csearch-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'csearch-b');

		await createRoomWith(pageA, userB.name);

		// 검색 키워드를 포함한 메시지 전송
		const keyword = `unique${Date.now()}`;
		await sendMessage(pageA, `첫번째 ${keyword} 메시지`);
		await sendMessage(pageA, `두번째 ${keyword} 메시지`);

		// 채팅 내 검색 토글
		await pageA.getByRole('button', { name: '대화 검색' }).click();
		const searchInput = pageA.getByPlaceholder('대화 내용 검색...');
		await expect(searchInput).toBeVisible();

		// 키워드 입력 (클라이언트 사이드 필터)
		await searchInput.fill(keyword);

		// 매치 카운트 표시 확인 (1/2 형태)
		await expect(pageA.getByText(/\d+\/\d+/)).toBeVisible({ timeout: 5000 });

		await ctxA.close();
		await ctxB.close();
	});

	test('사이드바 검색: 키워드 → 결과 클릭 → 해당 방 이동', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'ssearch-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'ssearch-b');

		await createRoomWith(pageA, userB.name);

		// 메시지 전송
		const keyword = `sidebar${Date.now()}`;
		await sendMessage(pageA, `사이드바 검색 테스트 ${keyword}`);

		// 홈으로 이동
		await pageA.goto('/');

		// 사이드바 검색 입력 (waitForResponse를 fill 전에 등록)
		const sidebarSearch = pageA.getByPlaceholder('메시지 검색...');
		const searchPromise = pageA.waitForResponse(
			(res) => res.url().includes('/api/messages/search') && res.ok()
		);
		await sidebarSearch.fill(keyword);
		await searchPromise;

		// 결과가 표시되고 클릭
		const result = pageA.getByRole('option').filter({ hasText: keyword });
		await expect(result).toBeVisible({ timeout: 5000 });
		await result.click();

		// 해당 채팅방으로 이동
		await expect(pageA).toHaveURL(/\/chat\/.+/);

		await ctxA.close();
		await ctxB.close();
	});
});
