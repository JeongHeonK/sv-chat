import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { assertRoomMember, getMessages } from '$lib/server/rooms';
import { saveMessage, broadcastMessage } from '$lib/server/rooms/send-message';
import { getIO } from '$lib/server/socket/io';

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

export const actions: Actions = {
	default: async (event) => {
		const userId = event.locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const { roomId } = event.params;

		const formData = await event.request.formData();
		const content = String(formData.get('content') ?? '').trim();
		if (!content) return fail(400, { error: 'Message cannot be empty' });

		await assertRoomMember(db, userId, roomId);

		const saved = await saveMessage(db, { roomId, senderId: userId, content });
		broadcastMessage(getIO(), roomId, saved);

		return { success: true };
	}
};
