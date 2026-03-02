<script lang="ts">
	import { tick, untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { createMessageStore } from '$lib/chat/message-store.svelte';
	import { createSocketConnection } from '$lib/socket';
	import { autoScroll } from '$lib/chat/auto-scroll';
	import type { AutoScrollCallbacks } from '$lib/chat/auto-scroll';
	import type { ChatMessage } from '$lib/types/chat';
	import MessageList from '$lib/components/message-list.svelte';
	import MessageInput from '$lib/components/message-input.svelte';
	import ChatRoomHeader from '$lib/components/chat-room-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowDown } from '@lucide/svelte';

	let { data }: PageProps = $props();

	const messageStore = createMessageStore([]);

	// 검색 상태
	let searchQuery = $state('');
	let currentMatchIndex = $state(0);

	const searchMatches = $derived.by(() => {
		if (!searchQuery.trim()) return [];
		const q = searchQuery.trim().toLowerCase();
		return messageStore.messages.filter((m) => m.content.toLowerCase().includes(q));
	});

	const highlightedMessageId = $derived(searchMatches[currentMatchIndex]?.id ?? undefined);

	let scrollContainer: HTMLDivElement | undefined = $state();

	// 스크롤 UX 상태
	let isAtBottom = $state(true);
	let newMessageCount = $state(0);
	let scrollToBottomFn: (() => void) | undefined = $state();
	let messageInputRef: HTMLInputElement | null = $state(null);

	const autoScrollCallbacks: AutoScrollCallbacks = {
		onAtBottomChange: (value) => {
			isAtBottom = value;
			if (value) newMessageCount = 0;
		},
		onReady: (api) => {
			scrollToBottomFn = api.scrollToBottom;
		}
	};

	const isSearchActive = $derived(searchQuery.trim().length > 0);

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isSearchActive) {
			messageInputRef?.focus();
			scrollToBottomFn?.();
		}
	}

	function handleScrollToBottom() {
		scrollToBottomFn?.();
		newMessageCount = 0;
	}

	function handleSendSuccess() {
		scrollToBottomFn?.();
	}

	function handleSearch(query: string) {
		searchQuery = query;
		currentMatchIndex = 0;
		scrollToMatch();
	}

	function handleSearchClose() {
		searchQuery = '';
		currentMatchIndex = 0;
	}

	function handleSearchNavigate(direction: 'prev' | 'next') {
		if (searchMatches.length === 0) return;
		if (direction === 'next') {
			currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
		} else {
			currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
		}
		scrollToMatch();
	}

	async function scrollToMatch() {
		await tick();
		if (!highlightedMessageId || !scrollContainer) return;
		const el = scrollContainer.querySelector(`[data-message-id="${highlightedMessageId}"]`);
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	$effect(() => {
		const roomId = data.roomId;

		untrack(() => {
			const msgs: ChatMessage[] = data.messages.map((m) => ({
				...m,
				createdAt: m.createdAt.toISOString(),
				senderName: m.senderName
			}));
			messageStore.messages.splice(0, messageStore.messages.length, ...msgs);
			newMessageCount = 0;
		});

		const { disconnect } = createSocketConnection(roomId, {
			onMessage: (msg) => {
				messageStore.addMessage(msg);
				if (!isAtBottom) newMessageCount += 1;
			},
			onSync: (msgs) => messageStore.mergeMessages(msgs),
			getLastTimestamp: () => messageStore.getLastTimestamp()
		});

		return disconnect;
	});
</script>

<svelte:document onkeydown={handleGlobalKeydown} />

<div class="flex h-full flex-col">
	<ChatRoomHeader title="채팅방" />
	<div
		class="relative flex-1 overflow-y-auto"
		use:autoScroll={autoScrollCallbacks}
		bind:this={scrollContainer}
	>
		<MessageList
			messages={messageStore.messages}
			currentUserId={data.currentUserId}
			{highlightedMessageId}
		/>
	</div>
	{#if !isAtBottom}
		<div class="flex justify-end px-4 pb-2">
			<Button
				variant="outline"
				size="icon"
				class="relative rounded-full shadow-md"
				onclick={handleScrollToBottom}
				aria-label="최하단으로 스크롤"
			>
				<ArrowDown class="h-4 w-4" />
				{#if newMessageCount > 0}
					<span
						class="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
					>
						{newMessageCount > 99 ? '99+' : newMessageCount}
					</span>
				{/if}
			</Button>
		</div>
	{/if}
	<div class="border-t p-4">
		<MessageInput
			matchCount={searchMatches.length}
			{currentMatchIndex}
			onSearch={handleSearch}
			onSearchClose={handleSearchClose}
			onSearchNavigate={handleSearchNavigate}
			onSendSuccess={handleSendSuccess}
			bind:inputRef={messageInputRef}
		/>
	</div>
</div>
