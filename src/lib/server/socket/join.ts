import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { getUserId } from './types';
import type { CheckMembershipFn } from './sync';

export function createJoinHandler(checkMembership: CheckMembershipFn) {
	return (socket: Socket) => {
		socket.on(
			SOCKET_EVENTS.JOIN_ROOM,
			async (payload: { roomId: string }, callback?: (ok: boolean) => void) => {
				try {
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
