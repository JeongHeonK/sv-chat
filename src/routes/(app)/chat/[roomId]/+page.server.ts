import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { assertRoomMember, getMessages } from '$lib/server/rooms';

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');
	const { roomId } = event.params;

	await assertRoomMember(db, userId, roomId);

	const before = event.url.searchParams.get('before');
	const messages = await getMessages(db, roomId, {
		before: before ? new Date(before) : undefined
	});

	return { messages, roomId };
};
