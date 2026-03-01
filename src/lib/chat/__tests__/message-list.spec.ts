import { describe, it, expect } from 'vitest';
import { isValidSocketMessage, toMessage, type ChatMessage } from '$lib/types/chat';
import { addMessage, mergeMessages, insertSorted } from '../message-list';

function makeMsg(id: string, createdAt: string, content = 'test'): ChatMessage {
	return { id, roomId: 'room-1', senderId: 'user-1', content, createdAt };
}

describe('isValidSocketMessage — 수신 메시지 타입 검증', () => {
	it('유효한 메시지 데이터를 통과시킨다', () => {
		const valid = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: '2024-01-01T10:00:00Z'
		};
		expect(isValidSocketMessage(valid)).toBe(true);
	});

	it('Date 타입 createdAt도 통과시킨다', () => {
		const valid = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: new Date()
		};
		expect(isValidSocketMessage(valid)).toBe(true);
	});

	it('잘못된 데이터를 거부한다', () => {
		expect(isValidSocketMessage(null)).toBe(false);
		expect(isValidSocketMessage(undefined)).toBe(false);
		expect(isValidSocketMessage(42)).toBe(false);
		expect(isValidSocketMessage({})).toBe(false);
		expect(isValidSocketMessage({ id: 123 })).toBe(false);
	});

	it('빈 id를 거부한다', () => {
		const invalid = {
			id: '',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: '2024-01-01T10:00:00Z'
		};
		expect(isValidSocketMessage(invalid)).toBe(false);
	});
});

describe('toMessage — 타임스탬프 정규화', () => {
	it('Date를 ISO 문자열로 변환한다', () => {
		const date = new Date('2024-01-01T10:00:00Z');
		const raw = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: date
		};
		const msg = toMessage(raw);
		expect(msg.createdAt).toBe('2024-01-01T10:00:00.000Z');
	});

	it('문자열 createdAt은 그대로 유지한다', () => {
		const raw = {
			id: 'msg-1',
			roomId: 'room-1',
			senderId: 'user-1',
			content: 'hello',
			createdAt: '2024-01-01T10:00:00Z'
		};
		const msg = toMessage(raw);
		expect(msg.createdAt).toBe('2024-01-01T10:00:00Z');
	});
});

describe('insertSorted — createdAt 기준 정렬 삽입', () => {
	it('중간 위치에 정렬 삽입한다', () => {
		const messages = [makeMsg('1', '2024-01-01T10:00:00Z'), makeMsg('3', '2024-01-01T12:00:00Z')];

		insertSorted(messages, makeMsg('2', '2024-01-01T11:00:00Z'));

		expect(messages.map((m) => m.id)).toEqual(['1', '2', '3']);
	});

	it('끝에 추가한다 (최신 메시지)', () => {
		const messages = [makeMsg('1', '2024-01-01T10:00:00Z')];
		insertSorted(messages, makeMsg('2', '2024-01-01T11:00:00Z'));

		expect(messages.map((m) => m.id)).toEqual(['1', '2']);
	});

	it('맨 앞에 삽입한다 (가장 오래된 메시지)', () => {
		const messages = [makeMsg('2', '2024-01-01T11:00:00Z')];
		insertSorted(messages, makeMsg('1', '2024-01-01T10:00:00Z'));

		expect(messages.map((m) => m.id)).toEqual(['1', '2']);
	});
});

describe('addMessage — 중복 방지 + 정렬 삽입', () => {
	it('메시지를 배열에 추가하고 true를 반환한다', () => {
		const messages: ChatMessage[] = [];
		const result = addMessage(messages, makeMsg('1', '2024-01-01T10:00:00Z'));

		expect(result).toBe(true);
		expect(messages).toHaveLength(1);
	});

	it('동일 ID 메시지를 중복 추가하지 않는다', () => {
		const messages: ChatMessage[] = [];
		addMessage(messages, makeMsg('1', '2024-01-01T10:00:00Z'));
		const result = addMessage(messages, makeMsg('1', '2024-01-01T10:00:00Z'));

		expect(result).toBe(false);
		expect(messages).toHaveLength(1);
	});

	it('정렬 순서를 유지하며 추가한다', () => {
		const messages: ChatMessage[] = [];
		addMessage(messages, makeMsg('3', '2024-01-01T12:00:00Z'));
		addMessage(messages, makeMsg('1', '2024-01-01T10:00:00Z'));
		addMessage(messages, makeMsg('2', '2024-01-01T11:00:00Z'));

		expect(messages.map((m) => m.id)).toEqual(['1', '2', '3']);
	});
});

describe('mergeMessages — 갭 메시지 병합', () => {
	it('여러 메시지를 중복 없이 병합한다', () => {
		const messages: ChatMessage[] = [makeMsg('1', '2024-01-01T10:00:00Z')];

		mergeMessages(messages, [
			makeMsg('1', '2024-01-01T10:00:00Z'), // 중복
			makeMsg('2', '2024-01-01T11:00:00Z'),
			makeMsg('3', '2024-01-01T12:00:00Z')
		]);

		expect(messages).toHaveLength(3);
		expect(messages.map((m) => m.id)).toEqual(['1', '2', '3']);
	});
});
