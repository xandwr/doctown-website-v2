import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parse } from 'cookie';

export const GET: RequestHandler = async ({ request }) => {
	const cookies = parse(request.headers.get('cookie') || '');
	const githubToken = cookies.github_token;

	if (!githubToken) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// affiliation=owner,collaborator,organization_member includes all repos (public and private) the user has access to
		// Note: Cannot use 'type' parameter together with 'affiliation'
		const response = await fetch(
			'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
			{
				headers: {
					Authorization: `Bearer ${githubToken}`,
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28'
				}
			}
		);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('GitHub API error:', response.status, errorData);
			return json(
				{ error: 'Failed to fetch repositories', details: errorData },
				{ status: response.status }
			);
		}

		const repos = await response.json();
		return json(repos);
	} catch (error) {
		console.error('Error fetching repositories:', error);
		return json({ error: 'Internal server error', details: String(error) }, { status: 500 });
	}
};
