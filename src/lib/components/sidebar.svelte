<script lang="ts">
	import type { RoomSummary } from '$lib/types/room';
	import RoomList from './room-list.svelte';

	let { rooms = [] }: { rooms?: RoomSummary[] } = $props();
</script>

<aside class="hidden w-72 shrink-0 border-r bg-sidebar md:block" aria-label="채팅 사이드바">
	<div class="p-4">
		<h2 class="text-sm font-semibold text-sidebar-foreground">채팅 목록</h2>
	</div>
	<RoomList {rooms} />
</aside>
