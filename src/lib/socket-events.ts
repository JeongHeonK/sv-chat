// keep in sync with src/lib/server/socket/events.ts
export const SOCKET_EVENTS = {
	SYNC: 'sync',
	JOIN_ROOM: 'join_room',
	MESSAGE_CREATED: 'message_created'
} as const;
