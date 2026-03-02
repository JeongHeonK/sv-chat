<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { goto } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';
	import { highlightMatches } from '$lib/utils/highlight';
	import type { SearchMessagesResult } from '$lib/types/search';

	const PAGE_SIZE = 20;

	let query = $state('');
	let results = $state<SearchMessagesResult[]>([]);
	let showResults = $state(false);
	let searched = $state(false);
	let hasMore = $state(false);
	let offset = $state(0);
	let currentQuery = $state('');

	async function search(q: string, searchOffset = 0) {
		if (!q.trim()) {
			results = [];
			showResults = false;
			searched = false;
			hasMore = false;
			offset = 0;
			return;
		}

		const res = await fetch(
			`/api/messages/search?q=${encodeURIComponent(q.trim())}&offset=${searchOffset}&limit=${PAGE_SIZE}`
		);

		if (res.ok) {
			const data: SearchMessagesResult[] = await res.json();
			if (searchOffset === 0) {
				results = data;
			} else {
				results = [...results, ...data];
			}
			showResults = true;
			searched = true;
			hasMore = data.length >= PAGE_SIZE;
			offset = searchOffset + data.length;
			currentQuery = q;
		}
	}

	const debouncedSearch = debounce((...args: unknown[]) => search(args[0] as string, 0), 300);

	function handleInput() {
		if (!query.trim()) {
			debouncedSearch.cancel();
			results = [];
			showResults = false;
			searched = false;
			hasMore = false;
			offset = 0;
			return;
		}
		debouncedSearch(query);
	}

	function selectMessage(msg: SearchMessagesResult) {
		goto(`/chat/${msg.roomId}`);
	}

	function loadMore() {
		search(currentQuery, offset);
	}
</script>

<div class="relative">
	<input
		type="text"
		placeholder="메시지 검색..."
		bind:value={query}
		oninput={handleInput}
		class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
		role="combobox"
		aria-expanded={showResults}
		aria-controls="message-search-listbox"
	/>

	{#if showResults}
		<ul
			id="message-search-listbox"
			role="listbox"
			class="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md"
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
					onkeydown={(e) => e.key === 'Enter' && selectMessage(msg)}
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
	{/if}
</div>
