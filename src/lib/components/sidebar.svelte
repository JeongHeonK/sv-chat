<script lang="ts">
	import type { RoomSummary } from '$lib/types/room';
	import RoomList from './room-list.svelte';
	import MessageSearch from './message-search.svelte';

	let { rooms = [] }: { rooms?: RoomSummary[] } = $props();
</script>

<aside class="hidden w-72 shrink-0 flex-col border-r bg-sidebar md:flex" aria-label="채팅 사이드바">
	<div class="p-4 pb-2">
		<h2 class="text-sm font-semibold text-sidebar-foreground">채팅 목록</h2>
	</div>
	<div class="px-4 pb-2">
		<MessageSearch />
	</div>
	<RoomList {rooms} />
</aside>
