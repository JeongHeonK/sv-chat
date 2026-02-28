const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
	if (!email || !email.trim()) return '이메일을 입력해 주세요.';
	if (!EMAIL_REGEX.test(email.trim())) return '올바른 이메일 형식을 입력해 주세요.';
	return null;
}

export function validatePassword(password: string): string | null {
	if (!password) return '비밀번호를 입력해 주세요.';
	if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
	return null;
}

export function validateName(name: string): string | null {
	if (!name || !name.trim()) return '이름을 입력해 주세요.';
	return null;
}

export interface LoginFormErrors {
	email: string | null;
	password: string | null;
}

export interface SignUpFormErrors {
	email: string | null;
	password: string | null;
	name: string | null;
}

export function validateLoginForm(data: { email: string; password: string }): LoginFormErrors {
	return {
		email: validateEmail(data.email),
		password: validatePassword(data.password)
	};
}

export function validateSignUpForm(data: {
	email: string;
	password: string;
	name: string;
}): SignUpFormErrors {
	return {
		email: validateEmail(data.email),
		password: validatePassword(data.password),
		name: validateName(data.name)
	};
}
