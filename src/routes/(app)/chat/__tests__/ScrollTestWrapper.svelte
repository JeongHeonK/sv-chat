<script lang="ts">
	import { autoScroll } from '$lib/chat/auto-scroll';
	import type { AutoScrollCallbacks } from '$lib/chat/auto-scroll';

	let {
		items = $bindable<string[]>([]),
		callbacks = {}
	}: { items?: string[]; callbacks?: AutoScrollCallbacks } = $props();
</script>

<div
	use:autoScroll={callbacks}
	data-testid="scroll-container"
	style="height: 200px; overflow-y: auto;"
>
	{#each items as item, i (i)}
		<div style="height: 50px; padding: 8px; border-bottom: 1px solid #ccc;">
			{item}
		</div>
	{/each}
</div>
