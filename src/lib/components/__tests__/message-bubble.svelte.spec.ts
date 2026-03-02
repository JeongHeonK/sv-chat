import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import MessageBubble from '$lib/components/message-bubble.svelte';
import type { ChatMessage } from '$lib/types/chat';

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
	return {
		id: 'msg-1',
		roomId: 'room-1',
		senderId: 'user-1',
		content: 'Hello',
		createdAt: '2024-03-15T10:30:00Z',
		...overrides
	};
}

describe('MessageBubble — URL 렌더링', () => {
	it('일반 텍스트는 링크 없이 그대로 표시된다', async () => {
		const message = createMessage({ content: '안녕하세요!' });
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		await expect.element(screen.getByText('안녕하세요!')).toBeVisible();
		const links = screen.container.querySelectorAll('a[target="_blank"]');
		expect(links.length).toBe(0);
	});

	it('https:// URL이 클릭 가능한 링크로 렌더링된다', async () => {
		const message = createMessage({ content: 'Visit https://example.com today' });
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		const link = screen.getByRole('link', { name: 'https://example.com' });
		await expect.element(link).toBeVisible();
		expect(link.element().getAttribute('href')).toBe('https://example.com');
	});

	it('URL 링크에 target="_blank"과 rel="noopener noreferrer"이 설정된다', async () => {
		const message = createMessage({ content: 'https://example.com' });
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		const link = screen.getByRole('link', { name: 'https://example.com' });
		const el = link.element();
		expect(el.getAttribute('target')).toBe('_blank');
		expect(el.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('www. 접두사 URL은 https://가 자동으로 추가된다', async () => {
		const message = createMessage({ content: 'Check www.example.com' });
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		const link = screen.getByRole('link', { name: 'www.example.com' });
		expect(link.element().getAttribute('href')).toBe('https://www.example.com');
	});

	it('텍스트와 URL이 혼합된 메시지를 올바르게 분리한다', async () => {
		const message = createMessage({
			content: '여기 보세요 https://example.com 좋은 사이트입니다'
		});
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		await expect.element(screen.getByText(/여기 보세요/)).toBeVisible();
		await expect.element(screen.getByText(/좋은 사이트입니다/)).toBeVisible();
		const link = screen.getByRole('link', { name: 'https://example.com' });
		await expect.element(link).toBeVisible();
	});

	it('여러 URL이 포함된 메시지에서 모든 URL이 링크로 렌더링된다', async () => {
		const message = createMessage({
			content: 'https://a.com and https://b.com'
		});
		const screen = render(MessageBubble, { props: { message, isMine: false } });

		const links = screen.container.querySelectorAll('a[target="_blank"]');
		expect(links.length).toBe(2);
	});
});
