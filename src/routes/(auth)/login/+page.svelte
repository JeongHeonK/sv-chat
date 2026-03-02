<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$ui/button';
	import * as Card from '$ui/card';
	import FormField from '$lib/components/form-field.svelte';
	import { validateLoginForm, type LoginFormErrors } from '$lib/validation/auth';

	let { form }: PageProps = $props();

	let clientErrors: LoginFormErrors = $state({ email: null, password: null });
	let submitting = $state(false);

	function handleEnhance({ formData, cancel }: { formData: FormData; cancel: () => void }) {
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');

		clientErrors = validateLoginForm({ email, password });

		if (clientErrors.email || clientErrors.password) {
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

	let emailError = $derived(form?.errors?.email ?? clientErrors.email);
	let passwordError = $derived(form?.errors?.password ?? clientErrors.password);
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">로그인</Card.Title>
		<Card.Description>계정에 로그인하세요.</Card.Description>
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
					로그인 중...
				{:else}
					로그인
				{/if}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			계정이 없으신가요?
			<a href={resolve('/signup')} class="text-primary underline-offset-4 hover:underline"
				>회원가입</a
			>
		</p>
	</Card.Footer>
</Card.Root>
