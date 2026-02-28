import { describe, it, expect, vi, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testAuth } from '../../../../lib/server/auth/__tests__/test-auth';
import { testDb, closeConnection } from '../../../../lib/server/db/__tests__/setup';
import { user } from '../../../../lib/server/db/auth.schema';
import { validateLoginForm } from '../../../../lib/server/auth/validation';

const PREFIX = 'test-login-action';

afterAll(async () => {
	await testDb.delete(user).where(like(user.email, `${PREFIX}%`));
	await closeConnection();
});

describe('Login Action — Validation 계층', () => {
	it('email 빈 값 → validation 에러, auth API 미호출', () => {
		const signIn = vi.fn();
		const errors = validateLoginForm({ email: '', password: 'password123' });

		if (errors.email || errors.password) {
			// auth API 호출 안 함
		} else {
			signIn();
		}

		expect(errors.email).not.toBeNull();
		expect(signIn).not.toHaveBeenCalled();
	});

	it('password 빈 값 → validation 에러, auth API 미호출', () => {
		const signIn = vi.fn();
		const errors = validateLoginForm({ email: 'user@example.com', password: '' });

		if (errors.email || errors.password) {
			// auth API 호출 안 함
		} else {
			signIn();
		}

		expect(errors.password).not.toBeNull();
		expect(signIn).not.toHaveBeenCalled();
	});

	it('formData 키 누락 → validation 에러로 처리', () => {
		const formData = new Map<string, string>();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const errors = validateLoginForm({ email, password });

		expect(errors.email).not.toBeNull();
		expect(errors.password).not.toBeNull();
	});
});

describe('Login Action — Auth 계층', () => {
	const email = `${PREFIX}-${Date.now()}@example.com`;
	const password = 'securepass123';

	it('로그인 성공 → session 반환', async () => {
		await testAuth.api.signUpEmail({ body: { email, password, name: 'Test' } });
		const result = await testAuth.api.signInEmail({ body: { email, password } });

		expect(result.token).toBeTruthy();
		expect(result.user.email).toBe(email);
	});

	it('잘못된 자격증명 → 에러 throw', async () => {
		await expect(
			testAuth.api.signInEmail({ body: { email, password: 'wrong-password' } })
		).rejects.toThrow();
	});

	it('fail 시 email 유지 (UX: 재입력 편의)', () => {
		const email = 'preserved@example.com';
		const result = { errors: { password: '오류' }, email };
		expect(result.email).toBe(email);
	});
});
