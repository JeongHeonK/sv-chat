import { json, type RequestHandler } from '@sveltejs/kit';
import { chatService } from '$lib/server/chat-service-instance';

/**
 * POST /api/rooms — 1:1 방 생성
 *
 * 요청:
 * {
 *   "otherUserId": "user-id-string"
 * }
 *
 * 응답:
 * {
 *   "roomId": "room-id-string"
 * }
 *
 * 인증 필수. 자신과 같은 사용자로 방을 생성할 수 없음.
 */
export const POST: RequestHandler = async (event) => {
	// 인증 확인
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = event.locals.user.id;
	let payload: unknown;
	try {
		payload = await event.request.json();
	} catch {
		return json({ error: 'Invalid JSON format' }, { status: 400 });
	}

	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('otherUserId' in payload) ||
		typeof payload.otherUserId !== 'string' ||
		!payload.otherUserId
	) {
		return json(
			{ error: 'otherUserId is required and must be a non-empty string' },
			{ status: 400 }
		);
	}

	const otherUserId = payload.otherUserId;

	// 자신과의 방 생성 방지
	if (userId === otherUserId) {
		return json({ error: 'Cannot create room with self' }, { status: 400 });
	}

	try {
		const room = await chatService.createRoom(userId, otherUserId);
		return json({ roomId: room.id }, { status: 200 });
	} catch (err: unknown) {
		console.error('Failed to create room:', err);
		return json({ error: 'Failed to create room' }, { status: 500 });
	}
};
