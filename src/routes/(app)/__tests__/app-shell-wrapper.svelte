<script lang="ts">
	import '../../layout.css';
	import Gnb from '$lib/components/gnb.svelte';
	import Sidebar from '$lib/components/sidebar.svelte';
</script>

<div class="flex h-screen flex-col">
	<Gnb />
	<div class="flex flex-1 overflow-hidden">
		<Sidebar rooms={[]} />
		<main class="flex-1 overflow-y-auto p-4">
			<p>메인 콘텐츠</p>
		</main>
	</div>
</div>
