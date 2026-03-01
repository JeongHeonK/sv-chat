<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';

	let { disabled = false }: { disabled?: boolean } = $props();

	let content = $state('');
	let submitting = $state(false);

	const canSend = $derived(content.trim().length > 0 && !disabled && !submitting);
</script>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				content = '';
			}
			submitting = false;
		};
	}}
>
	<div class="flex items-center gap-2">
		<label for="message-input" class="sr-only">메시지 입력</label>
		<Input
			id="message-input"
			name="content"
			placeholder="메시지를 입력하세요"
			bind:value={content}
			disabled={disabled || submitting}
			autocomplete="off"
		/>
		<Button type="submit" disabled={!canSend} aria-label="전송">전송</Button>
	</div>
</form>
