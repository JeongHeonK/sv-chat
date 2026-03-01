import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();
const mockManagerOn = vi.fn();

const mockOff = vi.fn();
const mockManagerOff = vi.fn();

const mockSocket = {
	emit: mockEmit,
	on: mockOn,
	off: mockOff,
	disconnect: mockDisconnect,
	io: { on: mockManagerOn, off: mockManagerOff }
};

vi.mock('socket.io-client', () => ({
	io: vi.fn(() => mockSocket)
}));

import { createSocketConnection } from '$lib/socket';

describe('createSocketConnection', () => {
	const onMessage = vi.fn();
	const onSync = vi.fn();
	const getLastTimestamp = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('연결 시 join_room 이벤트를 발행한다', () => {
		createSocketConnection('room-1', { onMessage, onSync, getLastTimestamp });

		expect(mockEmit).toHaveBeenCalledWith('join_room', { roomId: 'room-1' }, expect.any(Function));
	});

	it('message_created 수신 시 onMessage 콜백을 호출한다', () => {
		createSocketConnection('room-1', { onMessage, onSync, getLastTimestamp });

		const messageHandler = (mockOn as Mock).mock.calls.find(
			(c) => c[0] === 'message_created'
		)?.[1] as (data: unknown) => void;

		const rawMsg = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: '2024-01-01T10:00:00Z'
		};
		messageHandler(rawMsg);

		expect(onMessage).toHaveBeenCalledWith(rawMsg);
	});

	it('잘못된 메시지 데이터는 무시한다', () => {
		createSocketConnection('room-1', { onMessage, onSync, getLastTimestamp });

		const messageHandler = (mockOn as Mock).mock.calls.find(
			(c) => c[0] === 'message_created'
		)?.[1] as (data: unknown) => void;

		messageHandler({ invalid: true });
		messageHandler(null);

		expect(onMessage).not.toHaveBeenCalled();
	});

	it('재연결 시 sync 이벤트로 갭 메시지를 요청한다', () => {
		getLastTimestamp.mockReturnValue('2024-01-01T10:00:00Z');

		createSocketConnection('room-1', { onMessage, onSync, getLastTimestamp });

		const reconnectHandler = (mockManagerOn as Mock).mock.calls.find(
			(c) => c[0] === 'reconnect'
		)?.[1] as () => void;

		reconnectHandler();

		// Re-join
		expect(mockEmit).toHaveBeenCalledWith('join_room', { roomId: 'room-1' });

		// Sync request
		const syncCall = mockEmit.mock.calls.find((c) => c[0] === 'sync');
		expect(syncCall).toBeDefined();
		expect(syncCall?.[1]).toEqual({
			roomId: 'room-1',
			lastMessageTimestamp: '2024-01-01T10:00:00Z'
		});

		// Simulate sync callback with gap messages
		const syncCallback = syncCall?.[2] as (msgs: unknown[]) => void;
		const gapMessages = [
			{
				id: 'msg-2',
				roomId: 'room-1',
				senderId: 'user-1',
				content: 'gap',
				createdAt: '2024-01-01T11:00:00Z'
			}
		];
		syncCallback(gapMessages);

		expect(onSync).toHaveBeenCalledWith([
			{
				id: 'msg-2',
				roomId: 'room-1',
				senderId: 'user-1',
				content: 'gap',
				createdAt: '2024-01-01T11:00:00Z'
			}
		]);
	});

	it('disconnect()로 소켓 연결을 해제한다', () => {
		const { disconnect } = createSocketConnection('room-1', {
			onMessage,
			onSync,
			getLastTimestamp
		});

		disconnect();
		expect(mockOff).toHaveBeenCalledWith('message_created');
		expect(mockManagerOff).toHaveBeenCalledWith('reconnect');
		expect(mockDisconnect).toHaveBeenCalled();
	});
});
