import { render } from 'vitest-browser-svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import MessageInput from '$lib/components/message-input.svelte';

const defaultProps = { roomId: 'test-room-id' };

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('MessageInput — 렌더링', () => {
	it('텍스트 입력 필드와 전송 버튼이 존재한다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		await expect.element(screen.getByRole('textbox')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeVisible();
	});

	it('입력 필드에 placeholder가 있다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		await expect.element(screen.getByPlaceholder('메시지를 입력하세요')).toBeVisible();
	});
});

describe('MessageInput — disabled 상태', () => {
	it('disabled prop이 true면 입력 필드와 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput, { props: { ...defaultProps, disabled: true } });
		await expect.element(screen.getByRole('textbox')).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});
});

describe('MessageInput — 빈 메시지 전송 방지', () => {
	it('입력이 비어있으면 전송 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});

	it('입력이 있으면 전송 버튼이 활성화된다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		const input = screen.getByRole('textbox');
		await input.fill('테스트 메시지');
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeEnabled();
	});

	it('공백만 입력하면 전송 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		const input = screen.getByRole('textbox');
		await input.fill('   ');
		await expect.element(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
	});
});

describe('MessageInput — 접근성', () => {
	it('입력 필드에 접근성 라벨이 있다', async () => {
		const screen = render(MessageInput, { props: defaultProps });
		await expect.element(screen.getByLabelText('메시지 입력')).toBeVisible();
	});
});

describe('MessageInput — 메시지 전송', () => {
	it('전송 성공 시 입력 필드가 비워지고 onSendSuccess가 호출된다', async () => {
		const onSendSuccess = vi.fn();
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

		const screen = render(MessageInput, {
			props: { ...defaultProps, onSendSuccess }
		});
		const input = screen.getByRole('textbox');
		await input.fill('테스트');
		await screen.getByRole('button', { name: /전송/ }).click();

		await expect.element(input).toHaveValue('');
		expect(onSendSuccess).toHaveBeenCalled();
	});

	it('전송 실패 시 입력 내용이 복원된다', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

		const screen = render(MessageInput, { props: defaultProps });
		const input = screen.getByRole('textbox');
		await input.fill('실패 메시지');
		await screen.getByRole('button', { name: /전송/ }).click();

		await expect.element(input).toHaveValue('실패 메시지');
	});

	it('네트워크 에러 시 입력 내용이 복원된다', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

		const screen = render(MessageInput, { props: defaultProps });
		const input = screen.getByRole('textbox');
		await input.fill('에러 메시지');
		await screen.getByRole('button', { name: /전송/ }).click();

		await expect.element(input).toHaveValue('에러 메시지');
	});

	it('Enter 키로 메시지를 전송한다', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

		const screen = render(MessageInput, { props: defaultProps });
		const input = screen.getByRole('textbox');
		await input.fill('Enter 전송');
		await userEvent.keyboard('{Enter}');

		await expect.element(input).toHaveValue('');
	});
});

describe('MessageInput — 검색 모드', () => {
	it('검색 버튼 클릭 시 검색 모드로 전환된다', async () => {
		const screen = render(MessageInput, { props: defaultProps });

		await screen.getByRole('button', { name: '대화 검색' }).click();

		await expect.element(screen.getByPlaceholder('대화 내용 검색...')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: '검색 닫기' })).toBeVisible();
	});

	it('검색 닫기 버튼 클릭 시 일반 모드로 복귀하고 onSearchClose가 호출된다', async () => {
		const onSearchClose = vi.fn();
		const screen = render(MessageInput, { props: { ...defaultProps, onSearchClose } });

		await screen.getByRole('button', { name: '대화 검색' }).click();
		await screen.getByRole('button', { name: '검색 닫기' }).click();

		await expect.element(screen.getByPlaceholder('메시지를 입력하세요')).toBeVisible();
		expect(onSearchClose).toHaveBeenCalled();
	});

	it('검색 입력 시 onSearch 콜백이 호출된다', async () => {
		const onSearch = vi.fn();
		const screen = render(MessageInput, { props: { ...defaultProps, onSearch } });

		await screen.getByRole('button', { name: '대화 검색' }).click();
		const searchInput = screen.getByPlaceholder('대화 내용 검색...');
		await searchInput.fill('검색어');

		expect(onSearch).toHaveBeenCalledWith('검색어');
	});

	it('matchCount > 0일 때 결과 카운터가 표시된다', async () => {
		const screen = render(MessageInput, {
			props: { ...defaultProps, matchCount: 5, currentMatchIndex: 2 }
		});

		await screen.getByRole('button', { name: '대화 검색' }).click();

		await expect.element(screen.getByText('3/5')).toBeVisible();
	});

	it('이전/다음 결과 버튼 클릭 시 onSearchNavigate가 호출된다', async () => {
		const onSearchNavigate = vi.fn();
		const screen = render(MessageInput, {
			props: { ...defaultProps, matchCount: 3, onSearchNavigate }
		});

		await screen.getByRole('button', { name: '대화 검색' }).click();
		await screen.getByRole('button', { name: '이전 결과' }).click();
		expect(onSearchNavigate).toHaveBeenCalledWith('prev');

		await screen.getByRole('button', { name: '다음 결과' }).click();
		expect(onSearchNavigate).toHaveBeenCalledWith('next');
	});

	it('matchCount가 0이면 이전/다음 버튼이 비활성화된다', async () => {
		const screen = render(MessageInput, {
			props: { ...defaultProps, matchCount: 0 }
		});

		await screen.getByRole('button', { name: '대화 검색' }).click();

		await expect.element(screen.getByRole('button', { name: '이전 결과' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: '다음 결과' })).toBeDisabled();
	});
});
