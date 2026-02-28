import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import LoginPage from '../+page.svelte';

describe('Login Form — 렌더링', () => {
	it('이메일/비밀번호 입력 필드와 로그인 버튼, 회원가입 링크를 렌더링한다', async () => {
		const screen = render(LoginPage);

		await expect.element(screen.getByLabelText('이메일')).toBeVisible();
		await expect.element(screen.getByLabelText('비밀번호')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: '로그인' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /회원가입/ })).toBeVisible();
	});
});

describe('Login Form — 서버 에러', () => {
	it('form prop의 에러 메시지를 표시하고 email 값을 보존한다', async () => {
		const screen = render(LoginPage, {
			props: {
				params: {},
				data: {},
				form: {
					errors: { email: null, password: '이메일 또는 비밀번호가 올바르지 않습니다.' },
					email: 'test@example.com'
				}
			}
		});

		await expect
			.element(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.'))
			.toBeVisible();
		await expect.element(screen.getByLabelText('이메일')).toHaveValue('test@example.com');
	});
});

describe('Login Form — 클라이언트 validation', () => {
	it('빈 이메일로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(LoginPage);

		await screen.getByLabelText('비밀번호').fill('password123');
		await screen.getByRole('button', { name: '로그인' }).click();

		await expect.element(screen.getByText('이메일을 입력해 주세요.')).toBeVisible();
	});

	it('잘못된 이메일 형식으로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(LoginPage);

		await screen.getByLabelText('이메일').fill('invalid-email');
		await screen.getByLabelText('비밀번호').fill('password123');
		await screen.getByRole('button', { name: '로그인' }).click();

		await expect.element(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeVisible();
	});

	it('8자 미만 비밀번호로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(LoginPage);

		await screen.getByLabelText('이메일').fill('test@example.com');
		await screen.getByLabelText('비밀번호').fill('short');
		await screen.getByRole('button', { name: '로그인' }).click();

		await expect.element(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeVisible();
	});
});
