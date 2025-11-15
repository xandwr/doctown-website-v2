import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const RUNPOD_API_KEY = env.RUNPOD_API_KEY || '';
const RUNPOD_ENDPOINT_ID = env.RUNPOD_ENDPOINT_ID || '';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Check for authentication
	const github_token = cookies.get('github_token');
	if (!github_token) {
		return json({ error: 'Unauthorized: Please log in with GitHub' }, { status: 401 });
	}

	// Validate RunPod configuration
	if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
		return json(
			{ error: 'Server configuration error: RunPod credentials not configured' },
			{ status: 500 }
		);
	}

	try {
		// Parse request body
		const body = await request.json();
		const { owner, repo, branch = 'main' } = body;

		// Validate required fields
		if (!owner || !repo) {
			return json({ error: 'Missing required fields: owner and repo' }, { status: 400 });
		}

		// Prepare RunPod job payload
		const runpodPayload = {
			input: {
				owner,
				repo,
				branch,
				github_token
			}
		};

		// Call RunPod serverless endpoint
		const runpodUrl = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;
		const runpodResponse = await fetch(runpodUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${RUNPOD_API_KEY}`
			},
			body: JSON.stringify(runpodPayload)
		});

		if (!runpodResponse.ok) {
			const errorText = await runpodResponse.text();
			console.error('RunPod API error:', errorText);
			return json(
				{ error: 'Failed to start docpack generation', details: errorText },
				{ status: 502 }
			);
		}

		const runpodData = await runpodResponse.json();

		// Return job ID to frontend
		return json({
			success: true,
			jobId: runpodData.id,
			status: runpodData.status
		});
	} catch (error) {
		console.error('Error generating docpack:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
