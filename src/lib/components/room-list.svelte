<script lang="ts">
	import type { RoomSummary } from '$lib/types/room';
	import RoomItem from './room-item.svelte';

	let { rooms }: { rooms: RoomSummary[] } = $props();
</script>

{#if rooms.length === 0}
	<div class="flex flex-1 items-center justify-center p-4">
		<p class="text-sm text-muted-foreground">채팅이 없습니다</p>
	</div>
{:else}
	<nav class="flex flex-col" aria-label="채팅 목록">
		{#each rooms as room (room.id)}
			<RoomItem {room} />
		{/each}
	</nav>
{/if}
