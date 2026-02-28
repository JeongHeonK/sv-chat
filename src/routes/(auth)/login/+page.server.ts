import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { validateLoginForm } from '$lib/server/auth/validation';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');

		const errors = validateLoginForm({ email, password });
		if (errors.email || errors.password) {
			return fail(400, { errors, email });
		}

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch {
			return fail(400, {
				errors: { email: null, password: '이메일 또는 비밀번호가 올바르지 않습니다.' },
				email
			});
		}

		throw redirect(303, '/');
	}
};
