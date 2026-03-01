import type { User, Session } from 'better-auth/types';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocketData {
	user: User;
	session: Session;
}

export function getUserId(socket: Socket): string {
	const data = socket.data as Partial<AuthenticatedSocketData>;
	if (!data?.user?.id) throw new Error('Unauthenticated socket');
	return data.user.id;
}
