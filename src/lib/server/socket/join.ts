import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { getUserId } from './types';
import type { CheckMembershipFn } from './sync';

function isValidRoomPayload(data: unknown): data is { roomId: string } {
	if (typeof data !== 'object' || data === null) return false;
	return typeof (data as Record<string, unknown>).roomId === 'string';
}

export function createJoinHandler(checkMembership: CheckMembershipFn) {
	return (socket: Socket) => {
		socket.on(
			SOCKET_EVENTS.JOIN_ROOM,
			async (payload: unknown, callback?: (ok: boolean) => void) => {
				try {
					if (!isValidRoomPayload(payload)) {
						if (typeof callback === 'function') callback(false);
						return;
					}
					const userId = getUserId(socket);
					const isMember = await checkMembership(userId, payload.roomId);

					if (isMember) {
						await socket.join(payload.roomId);
						if (typeof callback === 'function') callback(true);
					} else {
						if (typeof callback === 'function') callback(false);
					}
				} catch {
					if (typeof callback === 'function') callback(false);
				}
			}
		);
	};
}
