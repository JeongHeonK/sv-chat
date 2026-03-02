<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { debounce } from '$lib/utils/debounce';
	import { highlightMatches } from '$lib/utils/highlight';
	import type { SearchMessageItem, SearchMessagesResponse } from '$lib/types/search';

	const PAGE_SIZE = 20;

	let { isSearching = $bindable(false) } = $props();

	let query = $state('');
	let results = $state<SearchMessageItem[]>([]);
	let showResults = $state(false);
	let searched = $state(false);
	let hasMore = $state(false);
	let offset = $state(0);
	let currentQuery = $state('');

	function resetState() {
		results = [];
		showResults = false;
		searched = false;
		hasMore = false;
		offset = 0;
		currentQuery = '';
	}

	async function search(q: string, searchOffset = 0) {
		if (!q.trim()) {
			resetState();
			return;
		}

		const res = await fetch(
			`/api/messages/search?q=${encodeURIComponent(q.trim())}&offset=${searchOffset}&limit=${PAGE_SIZE}`
		);

		if (res.ok) {
			const data: SearchMessagesResponse = await res.json();
			if (searchOffset === 0) {
				results = data.messages;
			} else {
				results = [...results, ...data.messages];
			}
			showResults = true;
			searched = true;
			hasMore = searchOffset + data.messages.length < data.total;
			offset = searchOffset + data.messages.length;
			currentQuery = q;
		}
	}

	const debouncedSearch = debounce((...args: unknown[]) => search(args[0] as string, 0), 300);

	function handleInput() {
		if (!query.trim()) {
			debouncedSearch.cancel();
			resetState();
			return;
		}
		debouncedSearch(query);
	}

	function selectMessage(msg: SearchMessageItem) {
		goto(resolve(`/chat/${msg.roomId}`));
	}

	function handleResultKeydown(e: KeyboardEvent, msg: SearchMessageItem) {
		if (e.key === 'Enter') {
			selectMessage(msg);
		}
	}

	function loadMore() {
		search(currentQuery, offset);
	}

	$effect(() => {
		isSearching = query.trim().length > 0;
	});
</script>

<div class="flex h-full flex-col">
	<input
		type="text"
		placeholder="메시지 검색..."
		bind:value={query}
		oninput={handleInput}
		class="mt-1 w-full shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
		role="combobox"
		aria-expanded={showResults}
		aria-controls="message-search-listbox"
	/>

	{#if showResults}
		<ul
			id="message-search-listbox"
			role="listbox"
			class="mt-2 flex-1 overflow-y-auto rounded-md border bg-popover"
		>
			{#if results.length === 0 && searched}
				<li class="px-3 py-2 text-sm text-muted-foreground">검색 결과가 없습니다</li>
			{/if}
			{#each results as msg (msg.id)}
				<li
					role="option"
					aria-selected="false"
					class="cursor-pointer px-3 py-2 hover:bg-accent"
					onclick={() => selectMessage(msg)}
					onkeydown={(e) => handleResultKeydown(e, msg)}
					tabindex="0"
				>
					<div class="text-xs font-medium">{msg.senderName}</div>
					<div class="text-sm">
						{#each highlightMatches(msg.content, currentQuery) as segment, i (i)}
							{#if segment.type === 'highlight'}
								<mark class="bg-yellow-200 dark:bg-yellow-800">{segment.value}</mark>
							{:else}
								{segment.value}
							{/if}
						{/each}
					</div>
					<div class="text-xs text-muted-foreground">
						{new Date(msg.createdAt).toLocaleDateString('ko-KR')}
					</div>
				</li>
			{/each}
			{#if hasMore}
				<li class="border-t">
					<button
						data-more
						class="w-full px-3 py-2 text-center text-sm text-primary hover:bg-accent"
						onclick={loadMore}
					>
						더보기
					</button>
				</li>
			{/if}
		</ul>
	{:else if !query.trim()}
		<p class="mt-4 text-center text-sm text-muted-foreground">검색어를 입력하세요</p>
	{/if}
</div>
