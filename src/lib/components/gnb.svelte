<script lang="ts">
	import { Button } from '$ui/button';
	import { authClient } from '$lib/auth-client';

	let { userName }: { userName?: string } = $props();
</script>

<header class="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
	<span class="text-lg font-semibold">sv-chat</span>
	<div class="flex items-center gap-3">
		{#if userName}
			<span class="text-sm text-muted-foreground">{userName}</span>
		{/if}
		<Button
			variant="ghost"
			size="sm"
			onclick={async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							window.location.href = '/login';
						}
					}
				});
			}}
		>
			로그아웃
		</Button>
	</div>
</header>
