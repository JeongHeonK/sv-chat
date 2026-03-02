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

		// 에러 상태: /signup에 머물면서 에러 메시지 표시
		await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 5000 });
		expect(page.url()).toContain('/signup');
	});

	test('미인증 접근 → /login 리다이렉트', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL('/login');
		expect(page.url()).toContain('/login');
	});

	test('잘못된 비밀번호 → 에러 표시', async ({ page }) => {
		const user = createTestUser('wrongpw');
		await signup(page, user);
		await page.context().clearCookies();

		// 잘못된 비밀번호로 로그인 시도
		await page.goto('/login');
		await page.getByLabel('이메일').fill(user.email);
		await page.getByLabel('비밀번호').fill('WrongPassword999');
		await page.getByRole('button', { name: '로그인' }).click();

		// 에러 메시지 표시 확인
		await expect(page.getByRole('alert').filter({ hasText: '올바르지 않습니다' })).toBeVisible({
			timeout: 5000
		});
		// /login에 머물러야 함
		expect(page.url()).toContain('/login');
	});

	test('빈 필드 제출 → 클라이언트 검증 에러', async ({ page }) => {
		await page.goto('/login');

		// 빈 상태로 제출
		await page.getByRole('button', { name: '로그인' }).click();

		// 이메일/비밀번호 필드에 role="alert" 에러 메시지 표시
		await expect(page.getByRole('alert').filter({ hasText: '입력해 주세요' }).first()).toBeVisible({
			timeout: 3000
		});
	});
});
