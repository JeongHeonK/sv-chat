<script lang="ts">
	import type { ChatMessage } from '$lib/types/chat';
	import { formatMessageTime } from '$lib/utils/time-format';
	import { parseUrls } from '$lib/utils/url-parser';

	let { message, isMine }: { message: ChatMessage; isMine: boolean } = $props();

	const segments = $derived(parseUrls(message.content));
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
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		{#each segments as seg, i (i)}{#if seg.type === 'url'}<a
					href={seg.value.startsWith('http') ? seg.value : `https://${seg.value}`}
					target="_blank"
					rel="noopener noreferrer"
					class="break-all underline">{seg.value}</a
				>{:else}{seg.value}{/if}{/each}
	</div>
	<time class="text-xs text-muted-foreground" datetime={message.createdAt}>
		{formatMessageTime(message.createdAt)}
	</time>
</div>
