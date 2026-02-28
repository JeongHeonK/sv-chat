import { describe, it, expect, afterAll } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { testDb, closeConnection } from './setup';
import { user } from '../auth.schema';

const TEST_EMAIL_PREFIX = 'test-db-conn';

afterAll(async () => {
	await testDb.delete(user).where(sql`${user.email} LIKE ${TEST_EMAIL_PREFIX + '%'}`);
	await closeConnection();
});

describe('DB Connection', () => {
	it('SELECT 1로 연결 확인', async () => {
		const result = await testDb.execute(sql`SELECT 1 as val`);
		expect(result[0].val).toBe(1);
	});

	it('Auth user 테이블 존재 확인', async () => {
		const result = await testDb.select().from(user).limit(1);
		expect(Array.isArray(result)).toBe(true);
	});

	it('Dummy Insert + Select 왕복 검증', async () => {
		const testEmail = `${TEST_EMAIL_PREFIX}-${Date.now()}@example.com`;
		const testUser = {
			id: crypto.randomUUID(),
			name: 'Test User',
			email: testEmail,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await testDb.insert(user).values(testUser);
		const [inserted] = await testDb.select().from(user).where(eq(user.email, testEmail));

		expect(inserted).toBeDefined();
		expect(inserted.email).toBe(testEmail);
		expect(inserted.name).toBe('Test User');
	});

	it('user 테이블 필수 컬럼 구조 확인 (id, email, name)', async () => {
		const result = await testDb.execute(sql`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_name = 'user'
			ORDER BY ordinal_position
		`);

		const columns = result.map((row) => (row as { column_name: string }).column_name);
		expect(columns).toContain('id');
		expect(columns).toContain('email');
		expect(columns).toContain('name');
	});
});
