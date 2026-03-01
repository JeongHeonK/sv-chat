import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const room = pgTable('room', {
	id: text('id').primaryKey(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const roomUser = pgTable('room_user', {
	id: text('id').primaryKey(),
	roomId: text('room_id')
		.notNull()
		.references(() => room.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	joinedAt: timestamp('joined_at').notNull().defaultNow()
});

export const message = pgTable(
	'message',
	{
		id: text('id').primaryKey(),
		roomId: text('room_id')
			.notNull()
			.references(() => room.id, { onDelete: 'cascade' }),
		senderId: text('sender_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_message_room_created').on(t.roomId, t.createdAt.desc())]
);

export type Room = typeof room.$inferSelect;
export type NewRoom = typeof room.$inferInsert;
export type RoomUser = typeof roomUser.$inferSelect;
export type NewRoomUser = typeof roomUser.$inferInsert;
export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;
