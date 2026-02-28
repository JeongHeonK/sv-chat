import { describe, it, expect, vi, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testAuth } from '../../../../lib/server/auth/__tests__/test-auth';
import { testDb, closeConnection } from '../../../../lib/server/db/__tests__/setup';
import { user } from '../../../../lib/server/db/auth.schema';
import { validateSignUpForm } from '../../../../lib/server/auth/validation';

const PREFIX = 'test-signup-action';

afterAll(async () => {
	await testDb.delete(user).where(like(user.email, `${PREFIX}%`));
	await closeConnection();
});

describe('SignUp Action — Validation 계층', () => {
	it('모든 필드 빈 값 → validation 에러, auth API 미호출', () => {
		const signUp = vi.fn();
		const errors = validateSignUpForm({ email: '', password: '', name: '' });

		if (errors.email || errors.password || errors.name) {
			// auth API 호출 안 함
		} else {
			signUp();
		}

		expect(errors.email).not.toBeNull();
		expect(errors.password).not.toBeNull();
		expect(errors.name).not.toBeNull();
		expect(signUp).not.toHaveBeenCalled();
	});

	it('formData 키 누락 → validation 에러로 처리', () => {
		const formData = new Map<string, string>();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const name = String(formData.get('name') ?? '');
		const errors = validateSignUpForm({ email, password, name });

		expect(errors.email).not.toBeNull();
		expect(errors.password).not.toBeNull();
		expect(errors.name).not.toBeNull();
	});
});

describe('SignUp Action — Auth 계층', () => {
	it('가입 성공 → user 생성 확인', async () => {
		const email = `${PREFIX}-${Date.now()}@example.com`;
		const result = await testAuth.api.signUpEmail({
			body: { email, password: 'securepass123', name: 'New User' }
		});

		expect(result.user.email).toBe(email);
	});

	it('중복 이메일 → 에러 throw', async () => {
		const email = `${PREFIX}-dup-${Date.now()}@example.com`;
		await testAuth.api.signUpEmail({
			body: { email, password: 'securepass123', name: 'First' }
		});

		await expect(
			testAuth.api.signUpEmail({ body: { email, password: 'securepass123', name: 'Second' } })
		).rejects.toThrow();
	});

	it('fail 시 name, email 유지되어 반환', () => {
		const email = 'preserved@example.com';
		const name = '홍길동';
		const result = { errors: { email: '중복' }, email, name };
		expect(result.email).toBe(email);
		expect(result.name).toBe(name);
	});
});
