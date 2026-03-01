<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex h-full flex-col">
	<h2 class="border-b p-4 text-lg font-semibold">채팅방</h2>
	<div class="flex-1 overflow-y-auto p-4">
		{#each data.messages as msg (msg.id)}
			<div class="mb-2">
				<span class="font-medium">{msg.senderName}</span>
				<p>{msg.content}</p>
			</div>
		{/each}
	</div>
</div>
