<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { createMessageStore } from '$lib/chat/message-store.svelte';
	import { createSocketConnection } from '$lib/socket';
	import { autoScroll } from '$lib/chat/auto-scroll';
	import type { ChatMessage } from '$lib/types/chat';
	import MessageList from '$lib/components/message-list.svelte';
	import MessageInput from '$lib/components/message-input.svelte';

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
	<div class="flex-1 overflow-y-auto" use:autoScroll>
		<MessageList messages={messageStore.messages} currentUserId={data.currentUserId} />
	</div>
	<div class="border-t p-4">
		<MessageInput />
	</div>
</div>
