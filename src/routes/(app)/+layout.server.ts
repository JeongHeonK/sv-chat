import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { RoomSummary } from '$lib/types/room';
import { db } from '$lib/server/db';
import { getUserRooms, getUnreadCounts } from '$lib/server/rooms';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user || !event.locals.session) {
		throw redirect(303, '/login');
	}

	const userId = event.locals.user.id;
	const [rawRooms, unreadCounts] = await Promise.all([
		getUserRooms(db, userId),
		getUnreadCounts(db, userId)
	]);

	const unreadMap = new Map(unreadCounts.map((u) => [u.roomId, u.count]));

	const rooms: RoomSummary[] = rawRooms.map((r) => ({
		id: r.id,
		name: r.name,
		lastMessage: r.lastMessage,
		lastMessageAt: r.lastMessageAt,
		unreadCount: unreadMap.get(r.id) ?? 0
	}));

	return { user: event.locals.user, rooms };
};
