import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

type Auth = ReturnType<typeof betterAuth>;
let _auth: Auth | null = null;

function getAuth(): Auth {
	if (!_auth) {
		_auth = betterAuth({
			baseURL: env.ORIGIN,
			secret: env.BETTER_AUTH_SECRET,
			database: drizzleAdapter(db, { provider: 'pg' }),
			emailAndPassword: { enabled: true },
			plugins: [sveltekitCookies(getRequestEvent)]
		});
	}
	return _auth;
}

export const auth: Auth = new Proxy({} as Auth, {
	get(_, prop) {
		return Reflect.get(getAuth(), prop);
	}
});
