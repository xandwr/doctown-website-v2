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
			const errorText = await tokenResponse.text();
			console.error('GitHub token exchange failed:', tokenResponse.status, errorText);
			throw error(500, 'Failed to exchange code for token');
		}

		const tokenData = await tokenResponse.json();

		if (tokenData.error) {
			console.error('GitHub OAuth error:', tokenData);
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
		return redirect(302, '/');
	} catch (err) {
		console.error('OAuth callback error:', err);
		// Don't re-throw if it's already a redirect
		if (err instanceof Error && err.message.includes('redirect')) {
			throw err;
		}
		throw error(500, 'Authentication failed');
	}
};
