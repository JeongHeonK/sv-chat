<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	{@render children()}
</div>
