/**
 * 사용자 검색 결과 타입
 * 서버의 SearchUserResult와 동기화되어야 함
 */
export interface SearchUserResult {
	id: string;
	name: string;
	email: string;
	image: string | null;
}
