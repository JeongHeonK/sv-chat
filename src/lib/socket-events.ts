export const SOCKET_EVENTS = {
	SYNC: 'sync',
	JOIN_ROOM: 'join_room',
	MESSAGE_CREATED: 'message_created',
	ROOM_DELETED: 'room:deleted',
	ROOM_LEFT: 'room:left'
} as const;
