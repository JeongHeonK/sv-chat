import { createChatService } from './chat-service';
import { db } from './db';
import { getIO } from './socket/io';

export const chatService = createChatService({ db, getIO });
