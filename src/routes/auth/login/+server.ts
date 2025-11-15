import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CALLBACK_URL } from '$env/static/private';

export const GET: RequestHandler = async () => {
	// GitHub OAuth authorization URL
	const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
	githubAuthUrl.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID);
	githubAuthUrl.searchParams.set('scope', 'read:user user:email repo');
	githubAuthUrl.searchParams.set('redirect_uri', GITHUB_OAUTH_CALLBACK_URL);

	// Redirect to GitHub for authorization
	throw redirect(302, githubAuthUrl.toString());
};
