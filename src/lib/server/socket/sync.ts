import type { Socket } from 'socket.io';
import { and, gt, eq, asc } from 'drizzle-orm';
import { message, roomUser, type Message } from '$lib/server/db/chat.schema';
import type { Database } from '$lib/server/db';
import { SOCKET_EVENTS } from './events';

type SyncPayload = {
	roomId: string;
	lastMessageTimestamp: string;
};

export type QueryMessagesFn = (roomId: string, since: Date) => Promise<Message[]>;
export type CheckMembershipFn = (userId: string, roomId: string) => Promise<boolean>;

export function createMessageQuery(db: Database): QueryMessagesFn {
	return async (roomId, since) => {
		return db
			.select()
			.from(message)
			.where(and(eq(message.roomId, roomId), gt(message.createdAt, since)))
			.orderBy(asc(message.createdAt));
	};
}

export function createMembershipCheck(db: Database): CheckMembershipFn {
	return async (userId, roomId) => {
		const rows = await db
			.select({ id: roomUser.id })
			.from(roomUser)
			.where(and(eq(roomUser.userId, userId), eq(roomUser.roomId, roomId)))
			.limit(1);
		return rows.length > 0;
	};
}

interface SyncHandlerDeps {
	queryMessages: QueryMessagesFn;
	checkMembership: CheckMembershipFn;
}

export function createSyncHandler(deps: SyncHandlerDeps) {
	return (socket: Socket) => {
		socket.on(
			SOCKET_EVENTS.SYNC,
			async (payload: SyncPayload, callback: (messages: Message[]) => void) => {
				try {
					const userId = (socket.data.user as { id: string }).id;
					const isMember = await deps.checkMembership(userId, payload.roomId);
					if (!isMember) {
						if (typeof callback === 'function') callback([]);
						return;
					}

					const messages = await deps.queryMessages(
						payload.roomId,
						new Date(payload.lastMessageTimestamp)
					);
					if (typeof callback === 'function') callback(messages);
				} catch {
					if (typeof callback === 'function') callback([]);
				}
			}
		);
	};
}
