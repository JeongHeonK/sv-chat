import type { SearchUserResult } from './user';

/**
 * 검색 결과 타입 (사용자 검색)
 */
export type SearchResult = SearchUserResult;

/**
 * 메시지 검색 결과 타입
 */
export interface SearchMessagesResult {
	id: string;
	roomId: string;
	content: string;
	senderName: string;
	senderId: string;
	createdAt: string;
}
