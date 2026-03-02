<script lang="ts">
	let { count }: { count: number } = $props();

	const display = $derived(count > 99 ? '99+' : String(count));
</script>

{#if count > 0}
	<span
		data-unread-badge
		aria-label="읽지 않은 메시지 {count}개"
		class="text-destructive-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium"
	>
		{display}
	</span>
{/if}
