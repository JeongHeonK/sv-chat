import { json, isHttpError, type RequestHandler } from '@sveltejs/kit';
import { chatService } from '$lib/server/chat-service-instance';

const VALID_ACTIONS = ['leave', 'delete'] as const;
type RoomAction = (typeof VALID_ACTIONS)[number];

function isValidAction(value: string | null): value is RoomAction {
	return value !== null && VALID_ACTIONS.includes(value as RoomAction);
}

/**
 * DELETE /api/rooms/[roomId]?action=leave — 채팅방 나가기
 * DELETE /api/rooms/[roomId]?action=delete — 채팅방 삭제
 *
 * 인증 필수. 채팅방 멤버여야 함 (서비스 계층에서 검증).
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = event.locals.user.id;
	const { roomId } = event.params;

	if (!roomId) {
		return json({ error: 'Invalid roomId' }, { status: 400 });
	}

	const action = event.url.searchParams.get('action');

	if (!isValidAction(action)) {
		return json(
			{ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
			{ status: 400 }
		);
	}

	try {
		if (action === 'delete') {
			await chatService.deleteRoom(userId, roomId);
		} else {
			await chatService.leaveRoom(userId, roomId);
		}
		return json({ success: true }, { status: 200 });
	} catch (err: unknown) {
		if (isHttpError(err)) {
			return json({ error: err.body.message }, { status: err.status });
		}
		console.error(`Failed to ${action} room:`, err);
		return json({ error: `Failed to ${action} room` }, { status: 500 });
	}
};
