import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { RoomSummary } from '$lib/types/room';

export const load: LayoutServerLoad = (event) => {
	if (!event.locals.user || !event.locals.session) {
		throw redirect(303, '/login');
	}
	// TODO: 07-logic 머지 후 실제 DB 쿼리로 교체
	const rooms: RoomSummary[] = [];
	return { user: event.locals.user, rooms };
};
