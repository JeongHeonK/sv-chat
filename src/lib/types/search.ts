import type { SearchUserResult } from './user';

/**
 * 검색 결과 타입 (사용자 검색)
 */
export type SearchResult = SearchUserResult;

/**
 * 메시지 검색 결과 항목
 */
export interface SearchMessageItem {
	id: string;
	roomId: string;
	content: string;
	senderName: string;
	senderId: string;
	createdAt: string;
}

/**
 * 메시지 검색 API 응답 (서버 반환 구조)
 */
export interface SearchMessagesResponse {
	messages: SearchMessageItem[];
	total: number;
}
