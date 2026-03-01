import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import MessageInput from '$lib/components/message-input.svelte';

describe('MessageInput — 렌더링', () => {
	it('텍스트 입력 필드와 전송 버튼이 존재한다', async () => {
		const screen = render(MessageInput);
		await expect.element(screen.getByRole('textbox')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeVisible();
	});

	it('form 요소가 method=POST로 존재한다', async () => {
		const screen = render(MessageInput);
		const form = screen.container.querySelector('form');
		expect(form).not.toBeNull();
		expect(form?.method).toBe('post');
	});

	it('입력 필드의 name이 content이다', async () => {
		const screen = render(MessageInput);
		const input = screen.getByRole('textbox').element() as HTMLInputElement;
		expect(input.name).toBe('content');
	});

	it('입력 필드에 placeholder가 있다', async () => {
		const screen = render(MessageInput);
		await expect.element(screen.getByPlaceholder('메시지를 입력하세요')).toBeVisible();
	});
});

describe('MessageInput — disabled 상태', () => {
	it('disabled prop이 true면 입력 필드와 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput, { props: { disabled: true } });
		await expect.element(screen.getByRole('textbox')).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});
});

describe('MessageInput — 빈 메시지 전송 방지', () => {
	it('입력이 비어있으면 전송 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput);
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});

	it('입력이 있으면 전송 버튼이 활성화된다', async () => {
		const screen = render(MessageInput);
		const input = screen.getByRole('textbox');
		await input.fill('테스트 메시지');
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeEnabled();
	});

	it('공백만 입력하면 전송 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput);
		const input = screen.getByRole('textbox');
		await input.fill('   ');
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});
});

describe('MessageInput — 접근성', () => {
	it('입력 필드에 접근성 라벨이 있다', async () => {
		const screen = render(MessageInput);
		await expect.element(screen.getByLabelText('메시지 입력')).toBeVisible();
	});
});
