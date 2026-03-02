import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '$lib/socket-events';
import { isValidSocketMessage, toMessage, type ChatMessage } from '$lib/types/chat';

interface SocketCallbacks {
	onMessage: (msg: ChatMessage) => void;
	onSync: (messages: ChatMessage[]) => void;
	onRoomDeleted?: (data: { roomId: string }) => void;
	onRoomLeft?: (data: { roomId: string }) => void;
	getLastTimestamp: () => string | null;
}

function isRoomEvent(data: unknown): data is { roomId: string } {
	return (
		typeof data === 'object' &&
		data !== null &&
		'roomId' in data &&
		typeof (data as Record<string, unknown>).roomId === 'string'
	);
}

export function createSocketConnection(
	roomId: string,
	callbacks: SocketCallbacks
): { disconnect: () => void } {
	const socket: Socket = io();

	socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId }, (ok: boolean) => {
		if (!ok) console.error('[socket] Failed to join room:', roomId);
	});

	socket.on(SOCKET_EVENTS.MESSAGE_CREATED, (data: unknown) => {
		if (!isValidSocketMessage(data)) return;
		callbacks.onMessage(toMessage(data));
	});

	socket.on(SOCKET_EVENTS.ROOM_DELETED, (data: unknown) => {
		if (isRoomEvent(data)) {
			callbacks.onRoomDeleted?.(data);
		}
	});

	socket.on(SOCKET_EVENTS.ROOM_LEFT, (data: unknown) => {
		if (isRoomEvent(data)) {
			callbacks.onRoomLeft?.(data);
		}
	});

	socket.io.on('reconnect', () => {
		socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });

		const lastTs = callbacks.getLastTimestamp();
		if (lastTs) {
			socket.emit(
				SOCKET_EVENTS.SYNC,
				{ roomId, lastMessageTimestamp: lastTs },
				(gapMessages: unknown[]) => {
					if (!Array.isArray(gapMessages)) return;
					const valid = gapMessages.filter(isValidSocketMessage).map(toMessage);
					if (valid.length > 0) {
						callbacks.onSync(valid);
					}
				}
			);
		}
	});

	return {
		disconnect: () => {
			socket.off(SOCKET_EVENTS.MESSAGE_CREATED);
			socket.off(SOCKET_EVENTS.ROOM_DELETED);
			socket.off(SOCKET_EVENTS.ROOM_LEFT);
			socket.io.off('reconnect');
			socket.disconnect();
		}
	};
}
