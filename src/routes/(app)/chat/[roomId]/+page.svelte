<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { createMessageStore } from '$lib/chat/message-store.svelte';
	import { createSocketConnection } from '$lib/socket';
	import type { ChatMessage } from '$lib/types/chat';

	let { data }: PageProps = $props();

	const messageStore = createMessageStore([]);

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
	<h2 class="border-b p-4 text-lg font-semibold">채팅방</h2>
	<div class="flex-1 overflow-y-auto p-4">
		{#each messageStore.messages as msg (msg.id)}
			<div class="mb-2">
				<span class="font-medium">{msg.senderName || '알 수 없음'}</span>
				<p>{msg.content}</p>
			</div>
		{/each}
	</div>
</div>
