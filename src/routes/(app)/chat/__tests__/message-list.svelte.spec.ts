import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import MessageList from '$lib/components/message-list.svelte';
import type { ChatMessage } from '$lib/types/chat';

const CURRENT_USER_ID = 'user-1';

const mockMessages: ChatMessage[] = [
	{
		id: 'msg-1',
		roomId: 'room-1',
		senderId: 'user-2',
		content: '안녕하세요!',
		createdAt: '2024-03-15T10:30:00Z',
		senderName: '홍길동'
	},
	{
		id: 'msg-2',
		roomId: 'room-1',
		senderId: CURRENT_USER_ID,
		content: '반갑습니다!',
		createdAt: '2024-03-15T10:31:00Z',
		senderName: '나'
	},
	{
		id: 'msg-3',
		roomId: 'room-1',
		senderId: 'user-2',
		content: '오늘 날씨가 좋네요',
		createdAt: '2024-03-15T10:32:00Z',
		senderName: '홍길동'
	}
];

describe('MessageList — 빈 상태', () => {
	it('메시지가 없으면 빈 상태 안내를 표시한다', async () => {
		const screen = render(MessageList, {
			props: { messages: [], currentUserId: CURRENT_USER_ID }
		});
		await expect.element(screen.getByText('메시지가 없습니다')).toBeVisible();
	});
});

describe('MessageList — 메시지 렌더링', () => {
	it('모든 메시지의 내용을 표시한다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		await expect.element(screen.getByText('안녕하세요!')).toBeVisible();
		await expect.element(screen.getByText('반갑습니다!')).toBeVisible();
		await expect.element(screen.getByText('오늘 날씨가 좋네요')).toBeVisible();
	});

	it('수신 메시지에 발신자 이름을 표시한다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		const senderLabels = screen.container.querySelectorAll('[data-sender-name]');
		const names = Array.from(senderLabels).map((el) => el.textContent);
		expect(names.filter((n) => n === '홍길동')).toHaveLength(2);
	});

	it('발신 메시지에는 발신자 이름을 표시하지 않는다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		const sentBubbles = screen.container.querySelectorAll('[data-mine="true"]');
		expect(sentBubbles).toHaveLength(1);
		const senderName = sentBubbles[0]?.querySelector('[data-sender-name]');
		expect(senderName).toBeNull();
	});
});

describe('MessageList — 발신/수신 구분', () => {
	it('발신 메시지(isMine)는 오른쪽 정렬된다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		const sentBubbles = screen.container.querySelectorAll('[data-mine="true"]');
		expect(sentBubbles).toHaveLength(1);
		expect(sentBubbles[0]?.classList.contains('items-end')).toBe(true);
	});

	it('수신 메시지는 왼쪽 정렬된다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		const receivedBubbles = screen.container.querySelectorAll('[data-mine="false"]');
		expect(receivedBubbles).toHaveLength(2);
		expect(receivedBubbles[0]?.classList.contains('items-start')).toBe(true);
	});
});

describe('MessageList — 시간 표시', () => {
	it('각 메시지에 HH:MM 형식의 시간을 표시한다', async () => {
		const screen = render(MessageList, {
			props: { messages: mockMessages, currentUserId: CURRENT_USER_ID }
		});
		const timeElements = screen.container.querySelectorAll('time');
		expect(timeElements.length).toBe(3);
		// ISO string에서 시간 부분 확인 — 로컬 시간대에 따라 변동되므로 time 요소의 존재만 확인
		for (const el of timeElements) {
			expect(el.getAttribute('datetime')).toBeTruthy();
			expect(el.textContent).toMatch(/^\d{1,2}:\d{2}$/);
		}
	});
});
