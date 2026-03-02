<script lang="ts">
	import { tick, untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { createMessageStore } from '$lib/chat/message-store.svelte';
	import { createSocketConnection } from '$lib/socket';
	import { autoScroll } from '$lib/chat/auto-scroll';
	import type { ChatMessage } from '$lib/types/chat';
	import MessageList from '$lib/components/message-list.svelte';
	import MessageInput from '$lib/components/message-input.svelte';
	import ChatRoomHeader from '$lib/components/chat-room-header.svelte';

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
		});

		const { disconnect } = createSocketConnection(roomId, {
			onMessage: (msg) => messageStore.addMessage(msg),
			onSync: (msgs) => messageStore.mergeMessages(msgs),
			getLastTimestamp: () => messageStore.getLastTimestamp()
		});

		return disconnect;
	});
</script>

<div class="flex h-full flex-col">
	<ChatRoomHeader title="채팅방" />
	<div class="flex-1 overflow-y-auto" use:autoScroll bind:this={scrollContainer}>
		<MessageList
			messages={messageStore.messages}
			currentUserId={data.currentUserId}
			{highlightedMessageId}
		/>
	</div>
	<div class="border-t p-4">
		<MessageInput
			matchCount={searchMatches.length}
			{currentMatchIndex}
			onSearch={handleSearch}
			onSearchClose={handleSearchClose}
			onSearchNavigate={handleSearchNavigate}
		/>
	</div>
</div>
