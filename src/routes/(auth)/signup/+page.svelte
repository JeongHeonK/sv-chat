<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$ui/button';
	import * as Card from '$ui/card';
	import FormField from '$lib/components/form-field.svelte';
	import { validateSignUpForm, type SignUpFormErrors } from '$lib/validation/auth';

	let { form }: PageProps = $props();

	let clientErrors: SignUpFormErrors = $state({ email: null, password: null, name: null });

	function handleSubmit(event: SubmitEvent) {
		const formData = new FormData(event.target as HTMLFormElement);
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const name = String(formData.get('name') ?? '');

		clientErrors = validateSignUpForm({ email, password, name });

		if (clientErrors.email || clientErrors.password || clientErrors.name) {
			event.preventDefault();
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
		<form method="POST" novalidate onsubmit={handleSubmit} class="space-y-2">
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
			<Button type="submit" class="w-full">회원가입</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			이미 계정이 있으신가요?
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/login" class="text-primary underline-offset-4 hover:underline">로그인</a>
		</p>
	</Card.Footer>
</Card.Root>
