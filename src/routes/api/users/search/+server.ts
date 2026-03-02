import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { searchUsers } from '$lib/server/rooms';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const query = url.searchParams.get('q')?.trim();
	if (!query) {
		throw error(400, 'Missing search query parameter "q"');
	}

	const results = await searchUsers(db, query, locals.user.id);
	return json(results);
};
