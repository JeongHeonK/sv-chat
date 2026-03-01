<script lang="ts">
	import type { ChatMessage } from '$lib/types/chat';
	import MessageBubble from './message-bubble.svelte';

	let { messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string } = $props();
</script>

{#if messages.length === 0}
	<div class="flex flex-1 items-center justify-center p-4">
		<p class="text-sm text-muted-foreground">메시지가 없습니다</p>
	</div>
{:else}
	<div class="flex flex-col gap-3 p-4" role="log" aria-label="메시지 목록">
		{#each messages as message (message.id)}
			<MessageBubble {message} isMine={message.senderId === currentUserId} />
		{/each}
	</div>
{/if}
