import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } from '$env/static/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');

	if (!code) {
		throw error(400, 'No code provided');
	}

	try {
		// Exchange code for access token
		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				client_id: GITHUB_OAUTH_CLIENT_ID,
				client_secret: GITHUB_OAUTH_CLIENT_SECRET,
				code
			})
		});

		if (!tokenResponse.ok) {
			throw error(500, 'Failed to exchange code for token');
		}

		const tokenData = await tokenResponse.json();

		if (tokenData.error) {
			throw error(400, tokenData.error_description || tokenData.error);
		}

		const accessToken = tokenData.access_token;

		// Set the token in a secure HTTP-only cookie using the platform cookie API
		cookies.set('github_token', accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		// Redirect to home page
		throw redirect(302, '/');
	} catch (err) {
		console.error('OAuth callback error:', err);
		throw error(500, 'Authentication failed');
	}
};
