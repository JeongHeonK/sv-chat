<script lang="ts">
	import Gnb from '$lib/components/gnb.svelte';
	import Sidebar from '$lib/components/sidebar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex h-screen flex-col">
	<Gnb userName={data.user.name} />
	<div class="flex flex-1 overflow-hidden">
		<Sidebar />
		<main class="flex-1 overflow-y-auto p-4">
			{@render children()}
		</main>
	</div>
</div>
