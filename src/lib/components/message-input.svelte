<script lang="ts">
	import { enhance } from '$app/forms';
	import { Search, X, ChevronUp, ChevronDown } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';

	let {
		disabled = false,
		matchCount = 0,
		currentMatchIndex = 0,
		onSearch,
		onSearchClose,
		onSearchNavigate,
		onSendSuccess,
		inputRef = $bindable(null)
	}: {
		disabled?: boolean;
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

	function handleEnhance() {
		submitting = true;
		return async ({
			result,
			update
		}: {
			result: import('@sveltejs/kit').ActionResult;
			update: () => Promise<void>;
		}) => {
			await update();
			if (result.type === 'success') {
				content = '';
				onSendSuccess?.();
			}
			submitting = false;
		};
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
	<form method="POST" use:enhance={handleEnhance}>
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
				name="content"
				placeholder="메시지를 입력하세요"
				bind:value={content}
				bind:ref={inputRef}
				disabled={disabled || submitting}
				autocomplete="off"
			/>
			<Button type="submit" disabled={!canSend} aria-label="전송">전송</Button>
		</div>
	</form>
{/if}
