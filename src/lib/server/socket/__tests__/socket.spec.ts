import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { createAuthMiddleware } from '../auth';
import { createSyncHandler } from '../sync';
import { createJoinHandler } from '../join';
import { SOCKET_EVENTS } from '$lib/socket-events';
import type { Message } from '$lib/server/db/chat.schema';
import type { SessionResult } from '$lib/server/auth/session';

const mockGetSession = vi.fn();
const mockQueryMessages = vi.fn();
const mockCheckMembership = vi.fn();

let httpServer: HttpServer;
let io: SocketIOServer;
let port: number;
const clients: ClientSocket[] = [];

function createClient(cookie?: string): ClientSocket {
	const client = ioClient(`http://localhost:${port}`, {
		autoConnect: false,
		...(cookie ? { extraHeaders: { cookie } } : {})
	});
	clients.push(client);
	return client;
}

function validSession(): NonNullable<SessionResult> {
	return {
		user: {
			id: 'user1',
			name: 'Test User',
			email: 'test@test.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null
		},
		session: {
			id: 'sess1',
			token: 'tok1',
			userId: 'user1',
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: null,
			userAgent: null
		}
	};
}

beforeAll(async () => {
	httpServer = createServer();
	io = new SocketIOServer(httpServer);

	io.use(createAuthMiddleware({ getSession: mockGetSession }));

	const handleSync = createSyncHandler({
		queryMessages: mockQueryMessages,
		checkMembership: mockCheckMembership
	});
	const handleJoin = createJoinHandler(mockCheckMembership);
	io.on('connection', (socket) => {
		handleSync(socket);
		handleJoin(socket);
	});

	await new Promise<void>((resolve) => {
		httpServer.listen(0, () => {
			port = (httpServer.address() as AddressInfo).port;
			resolve();
		});
	});
});

afterEach(() => {
	for (const c of clients) c.disconnect();
	clients.length = 0;
	vi.clearAllMocks();
});

afterAll(async () => {
	io.close();
	await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

describe('Socket.io Server', () => {
	it('유효한 세션으로 연결 성공', async () => {
		mockGetSession.mockResolvedValueOnce(validSession());

		const client = createClient('better-auth.session_token=valid');

		await new Promise<void>((resolve, reject) => {
			client.on('connect', () => resolve());
			client.on('connect_error', reject);
			client.connect();
		});

		expect(client.connected).toBe(true);
	});

	it('유효하지 않은 세션으로 연결 거부', async () => {
		mockGetSession.mockResolvedValueOnce(null);

		const client = createClient('better-auth.session_token=invalid');

		const error = await new Promise<Error>((resolve) => {
			client.on('connect_error', (err) => resolve(err));
			client.connect();
		});

		expect(error.message).toContain('Invalid session');
	});

	it('sync 이벤트로 갭 메시지 반환', async () => {
		const gapMessages: Message[] = [
			{
				id: 'msg1',
				roomId: 'room1',
				senderId: 'user2',
				content: 'Hello',
				createdAt: new Date('2024-01-01T00:01:00Z')
			}
		];

		mockGetSession.mockResolvedValueOnce(validSession());
		mockCheckMembership.mockResolvedValueOnce(true);
		mockQueryMessages.mockResolvedValueOnce(gapMessages);

		const client = createClient('better-auth.session_token=valid');

		await new Promise<void>((resolve, reject) => {
			client.on('connect', () => resolve());
			client.on('connect_error', reject);
			client.connect();
		});

		const result = await new Promise<Message[]>((resolve) => {
			client.emit(
				SOCKET_EVENTS.SYNC,
				{ roomId: 'room1', lastMessageTimestamp: '2024-01-01T00:00:00Z' },
				(messages: Message[]) => resolve(messages)
			);
		});

		expect(result).toHaveLength(1);
		expect(result[0].content).toBe('Hello');
		expect(mockCheckMembership).toHaveBeenCalledWith('user1', 'room1');
		expect(mockQueryMessages).toHaveBeenCalledWith('room1', new Date('2024-01-01T00:00:00Z'));
	});

	it('Room 비멤버의 sync 요청 시 빈 배열 반환', async () => {
		mockGetSession.mockResolvedValueOnce(validSession());
		mockCheckMembership.mockResolvedValueOnce(false);

		const client = createClient('better-auth.session_token=valid');

		await new Promise<void>((resolve, reject) => {
			client.on('connect', () => resolve());
			client.on('connect_error', reject);
			client.connect();
		});

		const result = await new Promise<Message[]>((resolve) => {
			client.emit(
				SOCKET_EVENTS.SYNC,
				{ roomId: 'room-not-mine', lastMessageTimestamp: '2024-01-01T00:00:00Z' },
				(messages: Message[]) => resolve(messages)
			);
		});

		expect(result).toHaveLength(0);
		expect(mockCheckMembership).toHaveBeenCalledWith('user1', 'room-not-mine');
		expect(mockQueryMessages).not.toHaveBeenCalled();
	});

	it('join_room 이벤트로 방 참여 성공', async () => {
		mockGetSession.mockResolvedValueOnce(validSession());
		mockCheckMembership.mockResolvedValueOnce(true);

		const client = createClient('better-auth.session_token=valid');

		await new Promise<void>((resolve, reject) => {
			client.on('connect', () => resolve());
			client.on('connect_error', reject);
			client.connect();
		});

		const result = await new Promise<boolean>((resolve) => {
			client.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: 'room1' }, (ok: boolean) => resolve(ok));
		});

		expect(result).toBe(true);
		expect(mockCheckMembership).toHaveBeenCalledWith('user1', 'room1');
	});

	it('비멤버의 join_room 요청 거부', async () => {
		mockGetSession.mockResolvedValueOnce(validSession());
		mockCheckMembership.mockResolvedValueOnce(false);

		const client = createClient('better-auth.session_token=valid');

		await new Promise<void>((resolve, reject) => {
			client.on('connect', () => resolve());
			client.on('connect_error', reject);
			client.connect();
		});

		const result = await new Promise<boolean>((resolve) => {
			client.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: 'room-forbidden' }, (ok: boolean) =>
				resolve(ok)
			);
		});

		expect(result).toBe(false);
		expect(mockCheckMembership).toHaveBeenCalledWith('user1', 'room-forbidden');
	});
});
