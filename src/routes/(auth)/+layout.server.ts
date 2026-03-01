import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	if (event.locals.user && event.locals.session) {
		throw redirect(303, '/');
	}
};
