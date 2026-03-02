import { render } from 'vitest-browser-svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageSearch from '$lib/components/message-search.svelte';
import type { SearchMessageItem } from '$lib/types/search';

const mockMessages: SearchMessageItem[] = [
	{
		id: 'msg-1',
		roomId: 'room-1',
		content: '안녕하세요 테스트 메시지입니다',
		senderName: '홍길동',
		senderId: 'user-1',
		createdAt: '2024-03-15T10:30:00Z'
	},
	{
		id: 'msg-2',
		roomId: 'room-2',
		content: '테스트 두 번째 메시지',
		senderName: '김철수',
		senderId: 'user-2',
		createdAt: '2024-03-15T11:00:00Z'
	}
];

const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

function createMockFetch(messages: SearchMessageItem[], total?: number, status = 200) {
	const response = { messages, total: total ?? messages.length };
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(response)
	});
}

describe('MessageSearch — 렌더링', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('fetch', createMockFetch([]));
	});

	it('검색 입력 필드를 렌더링한다', async () => {
		const screen = render(MessageSearch);
		await expect.element(screen.getByPlaceholder('메시지 검색...')).toBeVisible();
	});

	it('초기 상태에서 결과 목록은 숨겨져 있다', async () => {
		const screen = render(MessageSearch);
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
	});

	it('초기 상태에서 안내 텍스트를 표시한다', async () => {
		const screen = render(MessageSearch);
		await expect.element(screen.getByText('검색어를 입력하세요')).toBeVisible();
	});
});

describe('MessageSearch — 검색 기능', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it('입력 후 300ms 디바운스 후 API를 호출한다', async () => {
		const mockFetch = createMockFetch(mockMessages);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('테스트');
		await vi.advanceTimersByTimeAsync(300);

		expect(mockFetch).toHaveBeenCalledWith(
			'/api/messages/search?q=%ED%85%8C%EC%8A%A4%ED%8A%B8&offset=0&limit=20'
		);
	});

	it('검색 결과에 발신자 이름과 내용을 표시한다', async () => {
		vi.stubGlobal('fetch', createMockFetch(mockMessages));

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('테스트');
		await vi.advanceTimersByTimeAsync(300);

		await expect.element(screen.getByText('홍길동')).toBeVisible();
		await expect.element(screen.getByText('김철수')).toBeVisible();
	});

	it('검색 결과가 없으면 빈 상태 메시지를 표시한다', async () => {
		vi.stubGlobal('fetch', createMockFetch([]));

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('없는내용');
		await vi.advanceTimersByTimeAsync(300);

		await expect.element(screen.getByText('검색 결과가 없습니다')).toBeVisible();
	});

	it('빈 입력 시 API를 호출하지 않고 결과를 닫는다', async () => {
		const mockFetch = createMockFetch(mockMessages);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('테스트');
		await vi.advanceTimersByTimeAsync(300);
		expect(mockFetch).toHaveBeenCalledTimes(1);

		await input.fill('');
		await vi.advanceTimersByTimeAsync(300);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
	});
});

describe('MessageSearch — 결과 클릭 + 라우팅', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it('메시지를 클릭하면 해당 채팅방으로 이동한다', async () => {
		vi.stubGlobal('fetch', createMockFetch(mockMessages));

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('테스트');
		await vi.advanceTimersByTimeAsync(300);

		await screen.getByText('홍길동').click();

		expect(mockGoto).toHaveBeenCalledWith('/chat/room-1');
	});
});

describe('MessageSearch — 더보기 페이지네이션', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it('결과가 20개이고 total이 더 크면 더보기 버튼을 표시한다', async () => {
		const twentyMessages: SearchMessageItem[] = Array.from({ length: 20 }, (_, i) => ({
			id: `msg-${i}`,
			roomId: `room-${i}`,
			content: `메시지 ${i}`,
			senderName: `사용자${i}`,
			senderId: `user-${i}`,
			createdAt: '2024-03-15T10:30:00Z'
		}));

		vi.stubGlobal('fetch', createMockFetch(twentyMessages, 25));

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('메시지');
		await vi.advanceTimersByTimeAsync(300);

		await expect.element(screen.getByText('더보기')).toBeVisible();
	});

	it('결과가 total과 같으면 더보기 버튼을 숨긴다', async () => {
		vi.stubGlobal('fetch', createMockFetch(mockMessages, 2));

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('테스트');
		await vi.advanceTimersByTimeAsync(300);

		expect(screen.container.querySelector('button[data-more]')).toBeNull();
	});

	it('더보기 클릭 시 offset을 증가시켜 API를 호출한다', async () => {
		const twentyMessages: SearchMessageItem[] = Array.from({ length: 20 }, (_, i) => ({
			id: `msg-${i}`,
			roomId: `room-${i}`,
			content: `메시지 ${i}`,
			senderName: `사용자${i}`,
			senderId: `user-${i}`,
			createdAt: '2024-03-15T10:30:00Z'
		}));

		const mockFetch = createMockFetch(twentyMessages, 25);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(MessageSearch);
		const input = screen.getByPlaceholder('메시지 검색...');

		await input.fill('메시지');
		await vi.advanceTimersByTimeAsync(300);

		// 두 번째 페이지 응답
		const secondPageMessages: SearchMessageItem[] = [
			{
				id: 'msg-20',
				roomId: 'room-20',
				content: '메시지 20',
				senderName: '사용자20',
				senderId: 'user-20',
				createdAt: '2024-03-15T10:30:00Z'
			}
		];
		const secondPageFetch = createMockFetch(secondPageMessages, 25);
		vi.stubGlobal('fetch', secondPageFetch);

		await screen.getByText('더보기').click();

		expect(secondPageFetch).toHaveBeenCalledWith(
			'/api/messages/search?q=%EB%A9%94%EC%8B%9C%EC%A7%80&offset=20&limit=20'
		);
	});
});
