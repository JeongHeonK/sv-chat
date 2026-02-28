import { describe, it, expect, afterAll } from 'vitest';
import { like } from 'drizzle-orm';
import { testAuth } from './test-auth';
import { resolveSession } from '../session';
import { testDb, closeConnection } from '../../db/__tests__/setup';
import { user } from '../../db/auth.schema';

const PREFIX = 'test-middleware';

function extractCookie(setCookieHeader: string | null): string {
	if (!setCookieHeader) return '';
	return setCookieHeader.split(';')[0];
}

afterAll(async () => {
	await testDb.delete(user).where(like(user.email, `${PREFIX}%`));
	await closeConnection();
});

describe('Auth Middleware', () => {
	it('유효 세션 → locals.user/session 주입', async () => {
		const email = `${PREFIX}-valid-${Date.now()}@example.com`;
		const response = await testAuth.api.signUpEmail({
			body: { email, password: 'test-password-123', name: 'Middleware Test' },
			asResponse: true
		});

		const cookie = extractCookie(response.headers.get('set-cookie'));
		const headers = new Headers();
		headers.set('Cookie', cookie);

		const result = await resolveSession(testAuth.api, headers);

		expect(result).not.toBeNull();
		expect(result!.user.email).toBe(email);
		expect(result!.session).toBeDefined();
	});

	it('세션 없음 → locals 비어있음', async () => {
		const headers = new Headers();
		const result = await resolveSession(testAuth.api, headers);
		expect(result).toBeNull();
	});

	it('잘못된 형식의 헤더 → locals 비어있음 (에러 throw 안 함)', async () => {
		const headers = new Headers();
		headers.set('Cookie', 'better-auth.session_token=invalid-garbage-token-xxx');

		const result = await resolveSession(testAuth.api, headers);
		expect(result).toBeNull();
	});
});
