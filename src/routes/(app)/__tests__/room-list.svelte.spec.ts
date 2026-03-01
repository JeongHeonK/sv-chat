import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import RoomList from '$lib/components/room-list.svelte';
import type { RoomSummary } from '$lib/types/room';

const mockRooms: RoomSummary[] = [
	{
		id: 'room-1',
		name: '홍길동',
		lastMessage: '안녕하세요!',
		lastMessageAt: new Date('2024-03-15T10:30:00Z')
	},
	{
		id: 'room-2',
		name: '김철수',
		lastMessage: null,
		lastMessageAt: null
	}
];

describe('RoomList — 렌더링', () => {
	it('rooms 배열이 비어있으면 빈 상태 메시지를 표시한다', async () => {
		const screen = render(RoomList, { props: { rooms: [] } });
		await expect.element(screen.getByText('채팅이 없습니다')).toBeVisible();
	});

	it('rooms 배열에 항목이 있으면 각 방 이름을 표시한다', async () => {
		const screen = render(RoomList, { props: { rooms: mockRooms } });
		await expect.element(screen.getByText('홍길동')).toBeVisible();
		await expect.element(screen.getByText('김철수')).toBeVisible();
	});

	it('마지막 메시지를 표시한다', async () => {
		const screen = render(RoomList, { props: { rooms: mockRooms } });
		await expect.element(screen.getByText('안녕하세요!')).toBeVisible();
	});

	it('각 방 항목이 /chat/{id} 링크를 가진다', async () => {
		const screen = render(RoomList, { props: { rooms: mockRooms } });
		const links = screen.container.querySelectorAll('a');
		const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
		expect(hrefs).toContain('/chat/room-1');
		expect(hrefs).toContain('/chat/room-2');
	});
});
