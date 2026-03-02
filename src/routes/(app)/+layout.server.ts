import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { RoomSummary } from '$lib/types/room';
import { db } from '$lib/server/db';
import { getUserRooms, getUnreadCounts, updateLastReadAt } from '$lib/server/rooms';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user || !event.locals.session) {
		throw redirect(303, '/login');
	}

	event.depends('app:rooms');

	const userId = event.locals.user.id;

	// 채팅방 페이지 진입 시 lastReadAt를 getUnreadCounts보다 먼저 갱신
	// (layout load는 page load보다 먼저 실행되므로 여기서 처리해야 정확한 카운트 보장)
	const chatRoomMatch = event.url.pathname.match(/^\/chat\/([^/]+)/);
	if (chatRoomMatch) {
		await updateLastReadAt(db, userId, chatRoomMatch[1]);
	}

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
