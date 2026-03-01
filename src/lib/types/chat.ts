export interface ChatMessage {
	id: string;
	roomId: string;
	senderId: string;
	content: string;
	createdAt: string;
}

interface RawSocketMessage {
	id: string;
	roomId: string;
	senderId: string;
	content: string;
	createdAt: string | Date;
}

export function isValidSocketMessage(data: unknown): data is RawSocketMessage {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	return (
		typeof obj.id === 'string' &&
		obj.id.length > 0 &&
		typeof obj.roomId === 'string' &&
		typeof obj.senderId === 'string' &&
		typeof obj.content === 'string' &&
		(typeof obj.createdAt === 'string' || obj.createdAt instanceof Date)
	);
}

export function toMessage(raw: RawSocketMessage): ChatMessage {
	return {
		...raw,
		createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt
	};
}
