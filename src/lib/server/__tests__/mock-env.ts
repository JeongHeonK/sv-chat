export const env = {
	DATABASE_URL: process.env.DATABASE_URL ?? '',
	ORIGIN: process.env.ORIGIN ?? 'http://localhost:3000',
	BETTER_AUTH_SECRET:
		process.env.BETTER_AUTH_SECRET ?? 'test-secret-for-vitest-at-least-32-characters-long'
};
