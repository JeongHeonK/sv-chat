import { handler } from './build/handler.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { and, gt, eq, asc } from 'drizzle-orm';

// --- Event constants (keep in sync with src/lib/server/socket/events.ts) ---
const SOCKET_EVENTS = { SYNC: 'sync', JOIN_ROOM: 'join_room', MESSAGE_CREATED: 'message_created' };

// --- Schema (keep in sync with src/lib/server/db/chat.schema.ts) ---
const messageTable = pgTable(
	'message',
	{
		id: text('id').primaryKey(),
		roomId: text('room_id').notNull(),
		senderId: text('sender_id').notNull(),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_message_room_created').on(t.roomId, t.createdAt.desc())]
);

const roomUserTable = pgTable('room_user', {
	id: text('id').primaryKey(),
	roomId: text('room_id').notNull(),
	userId: text('user_id').notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow()
});

// --- DB ---
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// --- Auth ---
const auth = betterAuth({
	baseURL: process.env.ORIGIN,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true }
});

// --- HTTP Server ---
const httpServer = createServer(handler);

// --- Socket.io ---
const io = new Server(httpServer, {
	cors: { origin: process.env.ORIGIN, credentials: true }
});
// keep in sync with src/lib/server/socket/io.ts GLOBAL_KEY
globalThis.__svChatSocketIO = io;

io.use(async (socket, next) => {
	const cookie = socket.handshake.headers.cookie;
	if (!cookie) return next(new Error('Authentication required'));

	try {
		const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
		if (!session) return next(new Error('Invalid session'));

		socket.data.user = session.user;
		socket.data.session = session.session;
		next();
	} catch {
		next(new Error('Invalid session'));
	}
});

async function checkMembership(userId, roomId) {
	const rows = await db
		.select({ id: roomUserTable.id })
		.from(roomUserTable)
		.where(and(eq(roomUserTable.userId, userId), eq(roomUserTable.roomId, roomId)))
		.limit(1);
	return rows.length > 0;
}

io.on('connection', (socket) => {
	// Join room handler
	socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload, callback) => {
		try {
			if (typeof payload?.roomId !== 'string') {
				if (typeof callback === 'function') callback(false);
				return;
			}
			const { roomId } = payload;
			const isMember = await checkMembership(socket.data.user.id, roomId);
			if (isMember) {
				await socket.join(roomId);
				if (typeof callback === 'function') callback(true);
			} else {
				if (typeof callback === 'function') callback(false);
			}
		} catch {
			if (typeof callback === 'function') callback(false);
		}
	});

	socket.on(SOCKET_EVENTS.SYNC, async (payload, callback) => {
		try {
			if (
				typeof payload?.roomId !== 'string' ||
				typeof payload?.lastMessageTimestamp !== 'string'
			) {
				if (typeof callback === 'function') callback([]);
				return;
			}
			const { roomId, lastMessageTimestamp } = payload;

			const since = new Date(lastMessageTimestamp);
			if (isNaN(since.getTime())) {
				if (typeof callback === 'function') callback([]);
				return;
			}

			const isMember = await checkMembership(socket.data.user.id, roomId);
			if (!isMember) {
				if (typeof callback === 'function') callback([]);
				return;
			}

			const messages = await db
				.select()
				.from(messageTable)
				.where(and(eq(messageTable.roomId, roomId), gt(messageTable.createdAt, since)))
				.orderBy(asc(messageTable.createdAt));

			if (typeof callback === 'function') callback(messages);
		} catch {
			if (typeof callback === 'function') callback([]);
		}
	});
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
