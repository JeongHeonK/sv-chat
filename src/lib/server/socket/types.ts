import type { User, Session } from 'better-auth/types';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocketData {
	user: User;
	session: Session;
}

export function getUserId(socket: Socket): string {
	return (socket.data as AuthenticatedSocketData).user.id;
}
