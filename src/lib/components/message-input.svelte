<script lang="ts">
	import { tick } from 'svelte';
	import { Search, X, ChevronUp, ChevronDown } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';

	let {
		disabled = false,
		roomId,
		matchCount = 0,
		currentMatchIndex = 0,
		onSearch,
		onSearchClose,
		onSearchNavigate,
		onSendSuccess,
		inputRef = $bindable(null)
	}: {
		disabled?: boolean;
		roomId: string;
		matchCount?: number;
		currentMatchIndex?: number;
		onSearch?: (query: string) => void;
		onSearchClose?: () => void;
		onSearchNavigate?: (direction: 'prev' | 'next') => void;
		onSendSuccess?: () => void;
		inputRef?: HTMLInputElement | null;
	} = $props();

	let content = $state('');
	let submitting = $state(false);
	let searchMode = $state(false);
	let searchQuery = $state('');

	const canSend = $derived(content.trim().length > 0 && !disabled && !submitting);

	async function sendMessage() {
		if (!canSend) return;

		const message = content.trim();
		content = '';
		submitting = true;

		try {
			const res = await fetch(`/api/rooms/${roomId}/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: message })
			});
			if (res.ok) {
				onSendSuccess?.();
			} else {
				content = message;
			}
		} catch {
			content = message;
		} finally {
			submitting = false;
			await tick();
			inputRef?.focus();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function toggleSearchMode() {
		searchMode = !searchMode;
		if (!searchMode) {
			searchQuery = '';
			onSearchClose?.();
		}
	}

	function handleSearchInput() {
		onSearch?.(searchQuery);
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (e.shiftKey) {
				onSearchNavigate?.('prev');
			} else {
				onSearchNavigate?.('next');
			}
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			toggleSearchMode();
		}
	}
</script>

{#if searchMode}
	<div class="flex items-center gap-2">
		<label for="chat-search-input" class="sr-only">대화 내용 검색</label>
		<Input
			id="chat-search-input"
			placeholder="대화 내용 검색..."
			bind:value={searchQuery}
			oninput={handleSearchInput}
			onkeydown={handleSearchKeydown}
			autocomplete="off"
		/>
		{#if matchCount > 0}
			<span class="shrink-0 text-xs text-muted-foreground">
				{currentMatchIndex + 1}/{matchCount}
			</span>
		{/if}
		<Button
			variant="ghost"
			size="icon"
			onclick={() => onSearchNavigate?.('prev')}
			disabled={matchCount === 0}
			aria-label="이전 결과"
		>
			<ChevronUp class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			onclick={() => onSearchNavigate?.('next')}
			disabled={matchCount === 0}
			aria-label="다음 결과"
		>
			<ChevronDown class="h-4 w-4" />
		</Button>
		<Button variant="ghost" size="icon" onclick={toggleSearchMode} aria-label="검색 닫기">
			<X class="h-4 w-4" />
		</Button>
	</div>
{:else}
	<div class="flex items-center gap-2">
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onclick={toggleSearchMode}
			aria-label="대화 검색"
		>
			<Search class="h-4 w-4" />
		</Button>
		<label for="message-input" class="sr-only">메시지 입력</label>
		<Input
			id="message-input"
			placeholder="메시지를 입력하세요"
			bind:value={content}
			bind:ref={inputRef}
			disabled={disabled || submitting}
			autocomplete="off"
			onkeydown={handleKeydown}
		/>
		<Button type="button" disabled={!canSend} onclick={sendMessage} aria-label="전송">전송</Button>
	</div>
{/if}
