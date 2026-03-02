import { json, type RequestHandler } from '@sveltejs/kit';
import { chatService } from '$lib/server/chat-service-instance';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = event.locals.user.id;
	const { roomId } = event.params;

	if (!roomId) {
		return json({ error: 'Invalid roomId' }, { status: 400 });
	}

	const body: unknown = await event.request.json();
	const content =
		typeof body === 'object' && body !== null && 'content' in body
			? String((body as Record<string, unknown>).content ?? '').trim()
			: '';

	if (!content) {
		return json({ error: 'Message cannot be empty' }, { status: 400 });
	}
	if (content.length > 5000) {
		return json({ error: 'Message too long' }, { status: 400 });
	}

	try {
		await chatService.sendMessage({ userId, roomId, content });
		return json({ success: true }, { status: 200 });
	} catch (err: unknown) {
		console.error('Failed to send message:', err);
		return json({ error: 'Failed to send message' }, { status: 500 });
	}
};
