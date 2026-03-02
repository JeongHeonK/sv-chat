import { test, expect } from '@playwright/test';
import { createAuthenticatedContext } from './fixtures/auth';
import { createRoomWith } from './fixtures/chat';

test.describe('URL 파싱', () => {
	test('URL 포함 메시지 → a 태그 렌더링 + target="_blank"', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'url-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'url-b');

		await createRoomWith(pageA, userB.name);

		const urlMessage = 'https://example.com';
		await pageA.getByPlaceholder('메시지를 입력하세요').fill(urlMessage);
		await pageA.getByRole('button', { name: '전송' }).click();

		// a 태그 렌더링 확인
		const link = pageA.locator('a[href="https://example.com"]');
		await expect(link).toBeVisible({ timeout: 5000 });
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', /noopener/);

		await ctxA.close();
		await ctxB.close();
	});

	test('텍스트 + URL 혼합 메시지 정상 파싱', async ({ browser }) => {
		const { context: ctxA, page: pageA } = await createAuthenticatedContext(browser, 'mixed-a');
		const { context: ctxB, user: userB } = await createAuthenticatedContext(browser, 'mixed-b');

		await createRoomWith(pageA, userB.name);

		const mixedMessage = '확인해보세요 https://playwright.dev 좋아요';
		await pageA.getByPlaceholder('메시지를 입력하세요').fill(mixedMessage);
		await pageA.getByRole('button', { name: '전송' }).click();

		// 텍스트와 링크 모두 표시
		await expect(pageA.getByText('확인해보세요')).toBeVisible({ timeout: 5000 });
		const link = pageA.locator('a[href="https://playwright.dev"]');
		await expect(link).toBeVisible();
		await expect(pageA.getByText('좋아요')).toBeVisible();

		await ctxA.close();
		await ctxB.close();
	});
});
