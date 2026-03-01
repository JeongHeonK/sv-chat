<script lang="ts">
	import type { ChatMessage } from '$lib/types/chat';
	import { formatMessageTime } from '$lib/utils/time-format';

	let { message, isMine }: { message: ChatMessage; isMine: boolean } = $props();
</script>

<div
	class="flex flex-col gap-1"
	data-mine={isMine}
	class:items-end={isMine}
	class:items-start={!isMine}
>
	{#if !isMine}
		<span class="text-xs text-muted-foreground" data-sender-name
			>{message.senderName || '알 수 없음'}</span
		>
	{/if}
	<div
		class="max-w-[70%] rounded-2xl px-3 py-2 text-sm"
		class:bg-primary={isMine}
		class:text-primary-foreground={isMine}
		class:bg-muted={!isMine}
	>
		{message.content}
	</div>
	<time class="text-xs text-muted-foreground" datetime={message.createdAt}>
		{formatMessageTime(message.createdAt)}
	</time>
</div>
