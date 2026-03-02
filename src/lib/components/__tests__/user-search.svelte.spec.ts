import { render } from 'vitest-browser-svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserSearch from '$lib/components/user-search.svelte';
import type { SearchUserResult } from '$lib/types/user';

const mockUsers: SearchUserResult[] = [
	{ id: 'user-1', name: '홍길동', email: 'hong@test.com', image: null },
	{ id: 'user-2', name: '김철수', email: 'kim@test.com', image: null }
];

// goto mock
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

function createMockFetch(response: unknown, status = 200) {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(response)
	});
}

describe('UserSearch — 렌더링', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('fetch', createMockFetch([]));
	});

	it('검색 입력 필드를 렌더링한다', async () => {
		const screen = render(UserSearch);
		await expect.element(screen.getByPlaceholder('사용자 검색...')).toBeVisible();
	});

	it('초기 상태에서 드롭다운은 숨겨져 있다', async () => {
		const screen = render(UserSearch);
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
	});
});

describe('UserSearch — 검색 기능', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it('입력 후 300ms 디바운스 후 API를 호출한다', async () => {
		const mockFetch = createMockFetch(mockUsers);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(300);

		expect(mockFetch).toHaveBeenCalledWith('/api/users/search?q=%ED%99%8D');
	});

	it('300ms 이전에는 API를 호출하지 않는다', async () => {
		const mockFetch = createMockFetch(mockUsers);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(200);

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('검색 결과에 사용자 이름과 이메일을 표시한다', async () => {
		const mockFetch = createMockFetch(mockUsers);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(300);

		await expect.element(screen.getByText('홍길동')).toBeVisible();
		await expect.element(screen.getByText('hong@test.com')).toBeVisible();
		await expect.element(screen.getByText('김철수')).toBeVisible();
		await expect.element(screen.getByText('kim@test.com')).toBeVisible();
	});

	it('검색 결과가 없으면 빈 상태 메시지를 표시한다', async () => {
		vi.stubGlobal('fetch', createMockFetch([]));

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('없는사용자');
		await vi.advanceTimersByTimeAsync(300);

		await expect.element(screen.getByText('검색 결과가 없습니다')).toBeVisible();
	});

	it('빈 입력 시 API를 호출하지 않고 드롭다운을 닫는다', async () => {
		const mockFetch = createMockFetch(mockUsers);
		vi.stubGlobal('fetch', mockFetch);

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		// 먼저 검색
		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(300);
		expect(mockFetch).toHaveBeenCalledTimes(1);

		// 입력 비우기
		await input.fill('');
		await vi.advanceTimersByTimeAsync(300);

		// 추가 호출 없음
		expect(mockFetch).toHaveBeenCalledTimes(1);
		// 드롭다운 닫힘
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
	});
});

describe('UserSearch — 사용자 선택 + 방 생성', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it('사용자를 클릭하면 POST /api/rooms 호출 후 /chat/{roomId}로 이동한다', async () => {
		const searchFetch = createMockFetch(mockUsers);
		vi.stubGlobal('fetch', searchFetch);

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(300);

		// 방 생성 응답으로 교체
		const roomFetch = createMockFetch({ roomId: 'room-new-1' });
		vi.stubGlobal('fetch', roomFetch);

		// 첫 번째 사용자 클릭
		const userOption = screen.getByText('홍길동');
		await userOption.click();

		expect(roomFetch).toHaveBeenCalledWith('/api/rooms', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ otherUserId: 'user-1' })
		});

		// goto 호출 대기
		await vi.waitFor(() => {
			expect(mockGoto).toHaveBeenCalledWith('/chat/room-new-1');
		});
	});

	it('방 생성 후 검색 입력과 드롭다운이 초기화된다', async () => {
		vi.stubGlobal('fetch', createMockFetch(mockUsers));

		const screen = render(UserSearch);
		const input = screen.getByPlaceholder('사용자 검색...');

		await input.fill('홍');
		await vi.advanceTimersByTimeAsync(300);

		// 방 생성 응답으로 교체
		vi.stubGlobal('fetch', createMockFetch({ roomId: 'room-1' }));

		await screen.getByText('홍길동').click();

		await vi.waitFor(() => {
			expect(mockGoto).toHaveBeenCalled();
		});

		// 입력 필드 비워짐
		const inputEl = screen.getByPlaceholder('사용자 검색...');
		await expect.element(inputEl).toHaveValue('');
		// 드롭다운 닫힘
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
	});
});
