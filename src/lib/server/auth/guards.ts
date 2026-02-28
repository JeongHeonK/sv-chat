import { redirect } from '@sveltejs/kit';
import type { User, Session } from 'better-auth/types';
import type { RequestEvent } from '@sveltejs/kit';

export function requireAuth(event: Pick<RequestEvent, 'locals' | 'url'>): {
	user: User;
	session: Session;
} {
	const { user, session } = event.locals;

	if (!user || !session) {
		const redirectTo = event.url.pathname;
		throw redirect(307, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return { user, session };
}
