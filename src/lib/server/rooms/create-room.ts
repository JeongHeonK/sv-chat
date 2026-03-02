import { eq, or, ilike, and, ne } from 'drizzle-orm';
import { room, roomUser, type Room } from '$lib/server/db/chat.schema';
import { user } from '$lib/server/db/auth.schema';
import type { Database } from '$lib/server/db';
import { escapeLikePattern } from '$lib/server/db/utils';

export interface SearchUserResult {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

export async function searchUsers(
	db: Database,
	query: string,
	excludeUserId: string
): Promise<SearchUserResult[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const pattern = `%${escapeLikePattern(trimmed)}%`;

	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image
		})
		.from(user)
		.where(
			and(ne(user.id, excludeUserId), or(ilike(user.name, pattern), ilike(user.email, pattern)))
		)
		.limit(20);
}

function computeParticipantHash(userIdA: string, userIdB: string): string {
	return [userIdA, userIdB].sort().join(':');
}

export async function createOneToOneRoom(
	db: Database,
	userIdA: string,
	userIdB: string
): Promise<Room> {
	if (userIdA === userIdB) throw new Error('Cannot create room with self');
	const hash = computeParticipantHash(userIdA, userIdB);

	// 기존 방이 있으면 멤버십 복구 후 반환
	const existing = await db.select().from(room).where(eq(room.participantHash, hash)).limit(1);

	if (existing[0]) {
		// 나갔던 유저가 다시 대화 시작 시 roomUser 복구 (트랜잭션으로 중복 삽입 방지)
		const existingRoom = existing[0];
		await db.transaction(async (tx) => {
			for (const uid of [userIdA, userIdB]) {
				const membership = await tx
					.select()
					.from(roomUser)
					.where(and(eq(roomUser.roomId, existingRoom.id), eq(roomUser.userId, uid)))
					.limit(1);
				if (membership.length === 0) {
					await tx.insert(roomUser).values({
						id: crypto.randomUUID(),
						roomId: existingRoom.id,
						userId: uid,
						joinedAt: new Date()
					});
				}
			}
		});
		return existingRoom;
	}

	// 트랜잭션으로 room + roomUser 2개 생성
	try {
		return await db.transaction(async (tx) => {
			const roomId = crypto.randomUUID();
			const rows = await tx
				.insert(room)
				.values({
					id: roomId,
					participantHash: hash,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			const newRoom = rows[0];
			if (!newRoom) throw new Error('Failed to insert room');

			await tx.insert(roomUser).values([
				{
					id: crypto.randomUUID(),
					roomId,
					userId: userIdA,
					joinedAt: new Date()
				},
				{
					id: crypto.randomUUID(),
					roomId,
					userId: userIdB,
					joinedAt: new Date()
				}
			]);

			return newRoom;
		});
	} catch (err: unknown) {
		// unique constraint violation → 기존 방 반환 (race condition 처리)
		if (isUniqueViolation(err)) {
			const fallback = await db.select().from(room).where(eq(room.participantHash, hash)).limit(1);
			if (fallback[0]) {
				return fallback[0];
			}
			// This case is unexpected. The DB reported a unique violation, but we can't find the conflicting row.
			throw new Error(`Failed to resolve room creation conflict for hash: ${hash}.`);
		}
		throw err;
	}
}

function isUniqueViolation(err: unknown): boolean {
	if (typeof err !== 'object' || err === null) return false;
	const code = 'code' in err ? (err as Record<string, unknown>).code : undefined;
	return code === '23505';
}
