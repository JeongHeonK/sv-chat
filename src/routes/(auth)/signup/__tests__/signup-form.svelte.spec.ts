import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import SignUpPage from '../+page.svelte';

describe('SignUp Form — 렌더링', () => {
	it('이름/이메일/비밀번호 입력 필드와 회원가입 버튼, 로그인 링크를 렌더링한다', async () => {
		const screen = render(SignUpPage);

		await expect.element(screen.getByLabelText('이름')).toBeVisible();
		await expect.element(screen.getByLabelText('이메일')).toBeVisible();
		await expect.element(screen.getByLabelText('비밀번호')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: '회원가입' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /로그인/ })).toBeVisible();
	});
});

describe('SignUp Form — 서버 에러', () => {
	it('form prop의 에러 메시지를 표시하고 email/name 값을 보존한다', async () => {
		const screen = render(SignUpPage, {
			props: {
				params: {},
				data: {},
				form: {
					errors: { email: '이미 사용 중인 이메일입니다.', password: null, name: null },
					email: 'test@example.com',
					name: '홍길동'
				}
			}
		});

		await expect.element(screen.getByText('이미 사용 중인 이메일입니다.')).toBeVisible();
		await expect.element(screen.getByLabelText('이메일')).toHaveValue('test@example.com');
		await expect.element(screen.getByLabelText('이름')).toHaveValue('홍길동');
	});
});

describe('SignUp Form — 클라이언트 validation', () => {
	it('모든 필드가 빈 상태로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(SignUpPage);

		await screen.getByRole('button', { name: '회원가입' }).click();

		await expect.element(screen.getByText('이름을 입력해 주세요.')).toBeVisible();
		await expect.element(screen.getByText('이메일을 입력해 주세요.')).toBeVisible();
		await expect.element(screen.getByText('비밀번호를 입력해 주세요.')).toBeVisible();
	});

	it('잘못된 이메일 형식으로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(SignUpPage);

		await screen.getByLabelText('이름').fill('홍길동');
		await screen.getByLabelText('이메일').fill('invalid-email');
		await screen.getByLabelText('비밀번호').fill('password123');
		await screen.getByRole('button', { name: '회원가입' }).click();

		await expect.element(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeVisible();
	});

	it('8자 미만 비밀번호로 제출 시 에러 메시지를 표시한다', async () => {
		const screen = render(SignUpPage);

		await screen.getByLabelText('이름').fill('홍길동');
		await screen.getByLabelText('이메일').fill('test@example.com');
		await screen.getByLabelText('비밀번호').fill('short');
		await screen.getByRole('button', { name: '회원가입' }).click();

		await expect.element(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeVisible();
	});
});
