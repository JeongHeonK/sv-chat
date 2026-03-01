import { and, desc, eq, lt } from 'drizzle-orm';
import { message } from '$lib/server/db/chat.schema';
import { user } from '$lib/server/db/auth.schema';
import type { Database } from '$lib/server/db';

const DEFAULT_PAGE_SIZE = 50;

export interface MessageWithSender {
	id: string;
	roomId: string;
	senderId: string;
	senderName: string;
	content: string;
	createdAt: Date;
}

interface GetMessagesOptions {
	before?: Date;
	limit?: number;
}

export async function getMessages(
	db: Database,
	roomId: string,
	options?: GetMessagesOptions
): Promise<MessageWithSender[]> {
	const conditions = [eq(message.roomId, roomId)];
	if (options?.before) {
		conditions.push(lt(message.createdAt, options.before));
	}

	const rows = await db
		.select({
			id: message.id,
			roomId: message.roomId,
			senderId: message.senderId,
			senderName: user.name,
			content: message.content,
			createdAt: message.createdAt
		})
		.from(message)
		.innerJoin(user, eq(message.senderId, user.id))
		.where(and(...conditions))
		.orderBy(desc(message.createdAt))
		.limit(options?.limit ?? DEFAULT_PAGE_SIZE);

	return rows.reverse();
}
