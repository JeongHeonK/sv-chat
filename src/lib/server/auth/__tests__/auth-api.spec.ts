import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testAuth } from './test-auth';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';

const PREFIX = 'test-auth-api';

afterAll(async () => {
	await testDb.delete(user).where(like(user.email, `${PREFIX}%`));
	await closeConnection();
});

describe('Auth API', () => {
	const email = `${PREFIX}-${Date.now()}@example.com`;
	const password = 'password-123456';
	const name = 'Test User';

	it('회원가입 → user 생성 확인 (email, name 일치)', async () => {
		const result = await testAuth.api.signUpEmail({
			body: { email, password, name }
		});

		expect(result.user.email).toBe(email);
		expect(result.user.name).toBe(name);
	});

	it('중복 이메일 가입 실패', async () => {
		await expect(
			testAuth.api.signUpEmail({ body: { email, password, name } })
		).rejects.toThrow();
	});

	it('존재하지 않는 이메일로 로그인 → 실패', async () => {
		await expect(
			testAuth.api.signInEmail({
				body: { email: 'nonexistent@example.com', password }
			})
		).rejects.toThrow();
	});

	it('로그인 → session 반환 확인', async () => {
		const result = await testAuth.api.signInEmail({
			body: { email, password }
		});

		expect(result.token).toBeDefined();
		expect(result.user.email).toBe(email);
	});

	it('잘못된 비밀번호 → 로그인 실패', async () => {
		await expect(
			testAuth.api.signInEmail({ body: { email, password: 'wrong-password' } })
		).rejects.toThrow();
	});

	it('가입 후 즉시 로그인 가능 확인 (연속 플로우)', async () => {
		const flowEmail = `${PREFIX}-flow-${Date.now()}@example.com`;

		await testAuth.api.signUpEmail({
			body: { email: flowEmail, password: 'flow-pass-123', name: 'Flow User' }
		});

		const login = await testAuth.api.signInEmail({
			body: { email: flowEmail, password: 'flow-pass-123' }
		});

		expect(login.user.email).toBe(flowEmail);
		expect(login.token).toBeDefined();
	});
});
