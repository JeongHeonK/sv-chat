import { test as base, type Browser } from '@playwright/test';
import { signup } from './auth';
import { createTestUser } from './test-data';
import { createRoomWith } from './chat';

export type { TestUser } from './auth';
export { signup, login, createAuthenticatedContext } from './auth';
export { createRoomWith, sendMessage, waitForMessage } from './chat';
export { createTestUser } from './test-data';

export interface UserContext {
	page: import('@playwright/test').Page;
	context: import('@playwright/test').BrowserContext;
	user: { name: string; email: string; password: string };
}

async function createUserContext(browser: Browser, prefix: string): Promise<UserContext> {
	const context = await browser.newContext();
	const page = await context.newPage();
	const user = createTestUser(prefix);
	await signup(page, user);
	return { context, page, user };
}

interface TwoUserFixtures {
	userA: UserContext;
	userB: UserContext;
	roomId: string;
}

/**
 * 두 유저가 공통 채팅방에 있는 fixture.
 * messaging, unread 테스트에서 공통으로 사용.
 */
export const twoUserTest = base.extend<TwoUserFixtures>({
	// eslint-disable-next-line no-empty-pattern
	userA: async ({ browser }, use, testInfo) => {
		const prefix = `a-${testInfo.testId.slice(-6)}`;
		const ctx = await createUserContext(browser, prefix);
		await use(ctx);
		await ctx.context.close();
	},
	// eslint-disable-next-line no-empty-pattern
	userB: async ({ browser }, use, testInfo) => {
		const prefix = `b-${testInfo.testId.slice(-6)}`;
		const ctx = await createUserContext(browser, prefix);
		await use(ctx);
		await ctx.context.close();
	},
	roomId: async ({ userA, userB }, use) => {
		const id = await createRoomWith(userA.page, userB.user.name);
		await use(id);
	}
});

export const expect = base.expect;
