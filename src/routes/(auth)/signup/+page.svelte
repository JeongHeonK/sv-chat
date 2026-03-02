<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$ui/button';
	import * as Card from '$ui/card';
	import FormField from '$lib/components/form-field.svelte';
	import { validateSignUpForm, type SignUpFormErrors } from '$lib/validation/auth';

	let { form }: PageProps = $props();

	let clientErrors: SignUpFormErrors = $state({ email: null, password: null, name: null });
	let submitting = $state(false);

	function handleEnhance({ formData, cancel }: { formData: FormData; cancel: () => void }) {
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const name = String(formData.get('name') ?? '');

		clientErrors = validateSignUpForm({ email, password, name });

		if (clientErrors.email || clientErrors.password || clientErrors.name) {
			cancel();
			return;
		}

		submitting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			submitting = false;
		};
	}

	function handleKeydown(event: KeyboardEvent) {
		// IME 조합 중이면 무시 (한국어, 중국어 등)
		if (event.isComposing) return;

		if (event.key === 'Enter') {
			event.preventDefault();
			const form = (event.target as HTMLElement).closest('form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}

	let nameError = $derived(form?.errors?.name ?? clientErrors.name);
	let emailError = $derived(form?.errors?.email ?? clientErrors.email);
	let passwordError = $derived(form?.errors?.password ?? clientErrors.password);
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">회원가입</Card.Title>
		<Card.Description>새 계정을 만드세요.</Card.Description>
	</Card.Header>
	<Card.Content>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form
			method="POST"
			novalidate
			use:enhance={handleEnhance}
			onkeydown={handleKeydown}
			class="space-y-2"
		>
			<FormField id="name" label="이름" name="name" value={form?.name ?? ''} error={nameError} />
			<FormField
				id="email"
				label="이메일"
				name="email"
				type="email"
				value={form?.email ?? ''}
				error={emailError}
			/>
			<FormField
				id="password"
				label="비밀번호"
				name="password"
				type="password"
				error={passwordError}
			/>
			<Button type="submit" disabled={submitting} class="w-full">
				{#if submitting}
					회원가입 중...
				{:else}
					회원가입
				{/if}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			이미 계정이 있으신가요?
			<a href={resolve('/login')} class="text-primary underline-offset-4 hover:underline">로그인</a>
		</p>
	</Card.Footer>
</Card.Root>
