export function createTestUser(prefix: string) {
	const timestamp = Date.now();
	return {
		name: `${prefix}-${timestamp}`,
		email: `${prefix}-${timestamp}@e2e-test.com`,
		password: 'TestPassword123!'
	};
}
