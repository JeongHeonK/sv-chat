import type { Page } from '@playwright/test';

export async function createRoomWith(page: Page, otherUserName: string) {
	await page.getByRole('button', { name: '새 채팅 시작' }).click();
	const searchInput = page.getByPlaceholder('사용자 검색...');
	await searchInput.fill(otherUserName);
	await page.waitForResponse((res) => res.url().includes('/api/users/search') && res.ok());
	await page.getByRole('option').filter({ hasText: otherUserName }).click();
	await page.waitForURL(/\/chat\/.+/);
	const url = page.url();
	const roomId = url.split('/chat/')[1];
	return roomId;
}

export async function sendMessage(page: Page, content: string) {
	await page.getByPlaceholder('메시지를 입력하세요').fill(content);
	await page.getByRole('button', { name: '전송' }).click();
	await page.getByText(content).waitFor({ timeout: 5000 });
}

export async function waitForMessage(page: Page, content: string, timeout = 5000) {
	await page.getByText(content).waitFor({ timeout });
}
