<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { goto } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';
	import type { SearchUserResult } from '$lib/types/user';

	let query = $state('');
	let results = $state<SearchUserResult[]>([]);
	let showDropdown = $state(false);
	let searched = $state(false);

	async function search(q: string) {
		if (!q.trim()) {
			results = [];
			showDropdown = false;
			searched = false;
			return;
		}

		const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
		if (res.ok) {
			results = await res.json();
			showDropdown = true;
			searched = true;
		}
	}

	const debouncedSearch = debounce((...args: unknown[]) => search(args[0] as string), 300);

	function handleInput() {
		if (!query.trim()) {
			debouncedSearch.cancel();
			results = [];
			showDropdown = false;
			searched = false;
			return;
		}
		debouncedSearch(query);
	}

	async function selectUser(user: SearchUserResult) {
		const res = await fetch('/api/rooms', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ otherUserId: user.id })
		});

		if (res.ok) {
			const data: { roomId: string } = await res.json();
			query = '';
			results = [];
			showDropdown = false;
			searched = false;
			await goto(`/chat/${data.roomId}`);
		}
	}
</script>

<div class="relative">
	<input
		type="text"
		placeholder="사용자 검색..."
		bind:value={query}
		oninput={handleInput}
		class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
		role="combobox"
		aria-expanded={showDropdown}
		aria-controls="user-search-listbox"
		aria-autocomplete="list"
	/>

	{#if showDropdown}
		<ul
			id="user-search-listbox"
			role="listbox"
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md"
		>
			{#if results.length === 0 && searched}
				<li class="px-3 py-2 text-sm text-muted-foreground">검색 결과가 없습니다</li>
			{/if}
			{#each results as user (user.id)}
				<li
					role="option"
					aria-selected="false"
					class="cursor-pointer px-3 py-2 hover:bg-accent"
					onclick={() => selectUser(user)}
					onkeydown={(e) => e.key === 'Enter' && selectUser(user)}
					tabindex="0"
				>
					<div class="text-sm font-medium">{user.name}</div>
					<div class="text-xs text-muted-foreground">{user.email}</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
