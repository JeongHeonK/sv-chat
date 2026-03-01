import type { PageServerLoad } from './$types';
import { getUserRooms } from '$lib/server/rooms';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const rooms = await getUserRooms(db, event.locals.user!.id);
	return { rooms };
};
