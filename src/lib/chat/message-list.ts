import type { ChatMessage } from '$lib/types/chat';

export function insertSorted(messages: ChatMessage[], msg: ChatMessage): void {
	const idx = messages.findIndex((m) => m.createdAt > msg.createdAt);
	if (idx === -1) {
		messages.push(msg);
	} else {
		messages.splice(idx, 0, msg);
	}
}

export function addMessage(messages: ChatMessage[], msg: ChatMessage): boolean {
	if (messages.some((m) => m.id === msg.id)) return false;
	insertSorted(messages, msg);
	return true;
}

export function mergeMessages(messages: ChatMessage[], incoming: ChatMessage[]): void {
	for (const msg of incoming) {
		addMessage(messages, msg);
	}
}
