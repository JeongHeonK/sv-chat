import type { Page, Browser } from '@playwright/test';
import { createTestUser } from './test-data';

export interface TestUser {
	name: string;
	email: string;
	password: string;
}

export async function signup(page: Page, user: TestUser) {
	await page.goto('/signup');
	await page.getByLabel('이름').fill(user.name);
	await page.getByLabel('이메일').fill(user.email);
	await page.getByLabel('비밀번호').fill(user.password);
	await page.getByRole('button', { name: '회원가입' }).click();
	await page.waitForURL('/');
}

export async function login(page: Page, user: TestUser) {
	await page.goto('/login');
	await page.getByLabel('이메일').fill(user.email);
	await page.getByLabel('비밀번호').fill(user.password);
	await page.getByRole('button', { name: '로그인' }).click();
	await page.waitForURL('/');
}

export async function createAuthenticatedContext(browser: Browser, prefix: string) {
	const context = await browser.newContext();
	const page = await context.newPage();
	const user = createTestUser(prefix);
	await signup(page, user);
	return { context, page, user };
}
