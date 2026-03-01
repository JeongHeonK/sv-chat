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

<div class="flex flex-col">
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
	</div>
	<p id={errorId} class="mt-1 min-h-[14px] text-[10px] font-medium text-destructive" role="alert">
		{error ?? ''}
	</p>
</div>
