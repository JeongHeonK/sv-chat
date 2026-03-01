export interface RoomSummary {
	id: string;
	name: string;
	lastMessage: string | null;
	lastMessageAt: Date | null;
}
