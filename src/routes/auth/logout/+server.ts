import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the authentication cookie
	cookies.set('github_token', '', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 0 // Expire immediately
	});

	// Redirect to home page
	throw redirect(302, '/');
};
