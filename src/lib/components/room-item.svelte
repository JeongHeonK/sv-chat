<script lang="ts">
	import type { RoomSummary } from '$lib/types/room';
	import { formatRelativeTime } from '$lib/utils/time-format';

	let { room }: { room: RoomSummary } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	href="/chat/{room.id}"
	class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
		aria-hidden="true"
	>
		{room.name.charAt(0)}
	</div>
	<div class="flex-1 overflow-hidden">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">{room.name}</span>
			{#if room.lastMessageAt}
				<time class="text-xs text-muted-foreground" datetime={room.lastMessageAt.toISOString()}
					>{formatRelativeTime(room.lastMessageAt)}</time
				>
			{/if}
		</div>
		{#if room.lastMessage}
			<p class="truncate text-xs text-muted-foreground">{room.lastMessage}</p>
		{/if}
	</div>
</a>
