<script lang="ts">
	import UserSearch from '$lib/components/user-search.svelte';

	let showSearch = $state(false);
</script>

<div class="flex h-full flex-col items-center justify-center gap-4">
	<div class="text-center">
		<h1 class="text-2xl font-bold">sv-chat</h1>
		<p class="mt-2 text-muted-foreground">대화할 사용자를 검색하여 채팅을 시작하세요.</p>
	</div>
	{#if showSearch}
		<div class="w-full max-w-sm">
			<UserSearch />
		</div>
	{:else}
		<button
			type="button"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			onclick={() => (showSearch = true)}
		>
			새 채팅 시작
		</button>
	{/if}
</div>
