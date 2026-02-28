import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { testDb } from '../../db/__tests__/setup';

export const testAuth = betterAuth({
	baseURL: 'http://localhost:3000',
	secret: 'test-secret-for-vitest-at-least-32-characters-long',
	database: drizzleAdapter(testDb, { provider: 'pg' }),
	emailAndPassword: { enabled: true }
});
