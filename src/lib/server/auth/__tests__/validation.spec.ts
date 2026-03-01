import { describe, it, expect } from 'vitest';
import {
	validateEmail,
	validatePassword,
	validateName,
	validateLoginForm,
	validateSignUpForm
} from '../validation';

describe('validateEmail', () => {
	it('빈 값 → 에러 반환', () => {
		const result = validateEmail('');
		expect(result).not.toBeNull();
	});

	it('공백만 → 에러 반환', () => {
		const result = validateEmail('   ');
		expect(result).not.toBeNull();
	});

	it('잘못된 형식 → 에러 반환', () => {
		expect(validateEmail('not-an-email')).not.toBeNull();
		expect(validateEmail('missing@')).not.toBeNull();
		expect(validateEmail('@nodomain.com')).not.toBeNull();
	});

	it('정상 이메일 → null 반환', () => {
		expect(validateEmail('user@example.com')).toBeNull();
		expect(validateEmail('a.b+c@domain.co.kr')).toBeNull();
	});
});

describe('validatePassword', () => {
	it('빈 값 → 에러 반환', () => {
		expect(validatePassword('')).not.toBeNull();
	});

	it('8자 미만 → 에러 반환', () => {
		expect(validatePassword('abc123')).not.toBeNull();
	});

	it('숫자만 → 에러 반환', () => {
		expect(validatePassword('12345678')).not.toBeNull();
	});

	it('영문만 → 에러 반환', () => {
		expect(validatePassword('abcdefgh')).not.toBeNull();
	});

	it('경계값: 영문+숫자 정확히 8자 → 통과', () => {
		expect(validatePassword('abcd1234')).toBeNull();
	});

	it('정상 비밀번호 → null 반환', () => {
		expect(validatePassword('secure1pass')).toBeNull();
	});
});

describe('validateName', () => {
	it('빈 값 → 에러 반환', () => {
		expect(validateName('')).not.toBeNull();
	});

	it('공백만 → 에러 반환', () => {
		expect(validateName('   ')).not.toBeNull();
	});

	it('정상 이름 → null 반환', () => {
		expect(validateName('홍길동')).toBeNull();
		expect(validateName('John Doe')).toBeNull();
	});
});

describe('validateLoginForm', () => {
	it('모든 필드 빈 값 → 전체 에러 반환', () => {
		const result = validateLoginForm({ email: '', password: '' });
		expect(result.email).not.toBeNull();
		expect(result.password).not.toBeNull();
	});

	it('일부 필드만 유효 → 해당 필드만 에러', () => {
		const result = validateLoginForm({ email: 'user@example.com', password: 'short' });
		expect(result.email).toBeNull();
		expect(result.password).not.toBeNull();
	});

	it('모든 필드 유효 → 에러 없음', () => {
		const result = validateLoginForm({ email: 'user@example.com', password: 'secure1pass' });
		expect(result.email).toBeNull();
		expect(result.password).toBeNull();
	});
});

describe('validateSignUpForm', () => {
	it('모든 필드 빈 값 → 전체 에러 반환', () => {
		const result = validateSignUpForm({ email: '', password: '', name: '' });
		expect(result.email).not.toBeNull();
		expect(result.password).not.toBeNull();
		expect(result.name).not.toBeNull();
	});

	it('일부 필드만 유효 → 해당 필드만 에러', () => {
		const result = validateSignUpForm({
			email: 'user@example.com',
			password: 'secure1pass',
			name: ''
		});
		expect(result.email).toBeNull();
		expect(result.password).toBeNull();
		expect(result.name).not.toBeNull();
	});

	it('모든 필드 유효 → 에러 없음', () => {
		const result = validateSignUpForm({
			email: 'user@example.com',
			password: 'secure1pass',
			name: '홍길동'
		});
		expect(result.email).toBeNull();
		expect(result.password).toBeNull();
		expect(result.name).toBeNull();
	});
});
