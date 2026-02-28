<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$ui/button';
	import * as Card from '$ui/card';
	import FormField from '$lib/components/form-field.svelte';
	import { validateLoginForm, type LoginFormErrors } from '$lib/validation/auth';

	let { form }: PageProps = $props();

	let clientErrors: LoginFormErrors = $state({ email: null, password: null });

	function handleSubmit(event: SubmitEvent) {
		const formData = new FormData(event.target as HTMLFormElement);
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');

		clientErrors = validateLoginForm({ email, password });

		if (clientErrors.email || clientErrors.password) {
			event.preventDefault();
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
		<form method="POST" novalidate onsubmit={handleSubmit} class="space-y-2">
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
			<Button type="submit" class="w-full">로그인</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			계정이 없으신가요?
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/signup" class="text-primary underline-offset-4 hover:underline">회원가입</a>
		</p>
	</Card.Footer>
</Card.Root>
