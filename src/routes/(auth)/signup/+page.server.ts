import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { validateSignUpForm } from '$lib/server/auth/validation';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const name = String(formData.get('name') ?? '');

		const errors = validateSignUpForm({ email, password, name });
		if (errors.email || errors.password || errors.name) {
			return fail(400, { errors, email, name });
		}

		try {
			await auth.api.signUpEmail({ body: { email, password, name } });
		} catch {
			return fail(400, {
				errors: {
					email: '이미 사용 중인 이메일입니다.',
					password: null,
					name: null
				},
				email,
				name
			});
		}

		throw redirect(303, '/');
	}
};
