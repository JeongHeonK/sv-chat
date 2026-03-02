import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { assertRoomMember, getMessages, updateLastReadAt } from '$lib/server/rooms';
import { chatService } from '$lib/server/chat-service-instance';

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');
	const { roomId } = event.params;

	await assertRoomMember(db, userId, roomId);
	await updateLastReadAt(db, userId, roomId);

	const before = event.url.searchParams.get('before');
	const messages = await getMessages(db, roomId, {
		before: before ? new Date(before) : undefined
	});

	return { messages, roomId, currentUserId: userId };
};

export const actions: Actions = {
	default: async (event) => {
		const userId = event.locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const { roomId } = event.params;

		const formData = await event.request.formData();
		const content = String(formData.get('content') ?? '').trim();
		if (!content) return fail(400, { error: 'Message cannot be empty' });
		if (content.length > 5000) return fail(400, { error: 'Message too long' });

		await chatService.sendMessage({ userId, roomId, content });

		return { success: true };
	}
};
