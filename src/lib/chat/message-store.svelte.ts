import type { ChatMessage } from '$lib/types/chat';
import { addMessage, mergeMessages } from './message-list';

export function createMessageStore(initial: ChatMessage[] = []) {
	const messages = $state<ChatMessage[]>([...initial]);

	return {
		get messages() {
			return messages;
		},
		addMessage: (msg: ChatMessage) => addMessage(messages, msg),
		mergeMessages: (incoming: ChatMessage[]) => mergeMessages(messages, incoming),
		getLastTimestamp: () => (messages.length > 0 ? messages[messages.length - 1].createdAt : null)
	};
}
