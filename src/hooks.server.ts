import { parse } from 'cookie';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = parse(event.request.headers.get('cookie') || '');

	if (cookies.github_token) {
		try {
			// Fetch user info from GitHub using the access token
			const response = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${cookies.github_token}`,
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28'
				}
			});

			if (response.ok) {
				const userData = await response.json();
				event.locals.user = {
					id: userData.id,
					login: userData.login,
					name: userData.name,
					avatar_url: userData.avatar_url,
					email: userData.email
				};
			} else {
				event.locals.user = null;
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
