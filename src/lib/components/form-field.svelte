<script lang="ts">
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';

	interface Props {
		id: string;
		label: string;
		name: string;
		type?: HTMLInputTypeAttribute;
		value?: string;
		error?: string | null;
	}

	let { id, label, name, type = 'text', value = '', error = null }: Props = $props();

	let errorId = $derived(`${id}-error`);
</script>

<div class="space-y-2">
	<Label for={id}>{label}</Label>
	<Input
		{id}
		{type}
		{name}
		{value}
		aria-invalid={!!error}
		aria-describedby={error ? errorId : undefined}
	/>
	{#if error}
		<p id={errorId} class="text-sm text-destructive" role="alert">{error}</p>
	{/if}
</div>
