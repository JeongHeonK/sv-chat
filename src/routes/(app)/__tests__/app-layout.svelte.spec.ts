import { render } from 'vitest-browser-svelte';
import { describe, it, expect } from 'vitest';
import AppShellWrapper from './app-shell-wrapper.svelte';

describe('App Shell Layout — 구조', () => {
	it('GNB(header), Sidebar(aside), Main(main) 영역이 모두 존재한다', async () => {
		const { container } = render(AppShellWrapper);

		expect(container.querySelector('header')).not.toBeNull();
		expect(container.querySelector('aside')).not.toBeNull();
		expect(container.querySelector('main')).not.toBeNull();
	});

	it('Sidebar에 모바일 숨김 반응형 클래스가 적용되어 있다', async () => {
		const { container } = render(AppShellWrapper);

		const sidebar = container.querySelector('aside')!;
		expect(sidebar.classList.contains('hidden')).toBe(true);
		expect(sidebar.classList.contains('md:block')).toBe(true);
	});

	it('Main 영역에 flex-1이 적용되어 나머지 공간을 채운다', async () => {
		const { container } = render(AppShellWrapper);

		const main = container.querySelector('main')!;
		expect(main.classList.contains('flex-1')).toBe(true);
	});
});
