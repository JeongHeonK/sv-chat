import { test, expect } from '@playwright/test';
import { signup, login } from './fixtures/auth';
import { createTestUser } from './fixtures/test-data';

test.describe('인증', () => {
	test('회원가입 → 홈 리다이렉트 + 사용자명 표시', async ({ page }) => {
		const user = createTestUser('signup');
		await signup(page, user);
		expect(page.url()).toMatch(/http:\/\/localhost:\d+\/?$/);
		await expect(page.getByText(user.name)).toBeVisible();
	});

	test('로그인 → 홈 리다이렉트', async ({ page }) => {
		const user = createTestUser('login');
		// 회원가입으로 유저 생성
		await signup(page, user);
		// 쿠키 클리어로 로그아웃 (better-auth의 window.location 방식 우회)
		await page.context().clearCookies();
		// 로그인 테스트
		await login(page, user);
		expect(page.url()).toMatch(/http:\/\/localhost:\d+\/?$/);
	});

	test('중복 이메일 → 에러 표시', async ({ page }) => {
		const user = createTestUser('dup');
		// 첫 번째 회원가입 성공
		await signup(page, user);
		// 쿠키 클리어 후 재가입 시도
		await page.context().clearCookies();

		// 같은 이메일로 재가입 시도
		await page.goto('/signup');
		await page.getByLabel('이름').fill('다른이름');
		await page.getByLabel('이메일').fill(user.email);
		await page.getByLabel('비밀번호').fill(user.password);
		await page.getByRole('button', { name: '회원가입' }).click();

		// 에러 상태: URL이 /signup에 머물거나 에러 role="alert" 표시
		await page.waitForTimeout(1000);
		const isOnSignup = page.url().includes('/signup');
		const hasError = (await page.getByRole('alert').count()) > 0;
		expect(isOnSignup || hasError).toBe(true);
	});

	test('미인증 접근 → /login 리다이렉트', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL('/login');
		expect(page.url()).toContain('/login');
	});
});
