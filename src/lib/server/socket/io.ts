import type { Server as SocketIOServer } from 'socket.io';

const GLOBAL_KEY = '__svChatSocketIO';

export function setIO(io: SocketIOServer): void {
	(globalThis as Record<string, unknown>)[GLOBAL_KEY] = io;
}

export function getIO(): SocketIOServer {
	const io = (globalThis as Record<string, unknown>)[GLOBAL_KEY];
	if (!io) throw new Error('Socket.io server not initialized');
	return io as SocketIOServer;
}
