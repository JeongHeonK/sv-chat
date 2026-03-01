import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { searchMessages } from '$lib/server/rooms/search';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !locals.session) {
		throw error(401, 'Unauthorized');
	}

	const query = url.searchParams.get('q')?.trim();
	if (!query) {
		throw error(400, 'Missing search query parameter "q"');
	}

	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));

	const results = await searchMessages(db, locals.user.id, query, { offset, limit });

	return json(results);
};
