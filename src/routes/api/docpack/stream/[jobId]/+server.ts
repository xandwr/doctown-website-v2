import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const RUNPOD_API_KEY = env.RUNPOD_API_KEY || '';
const RUNPOD_ENDPOINT_ID = env.RUNPOD_ENDPOINT_ID || '';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const { jobId } = params;

	// Check for authentication
	const github_token = cookies.get('github_token');
	if (!github_token) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Validate RunPod configuration
	if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
		return new Response('Server configuration error', { status: 500 });
	}

	// Create a readable stream for SSE
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			// Helper function to send SSE message
			const sendEvent = (event: string, data: any) => {
				const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			try {
				let isComplete = false;
				let pollCount = 0;
				const maxPolls = 600; // 10 minutes max (600 * 1 second)

				// Poll RunPod for job status and stream results
				while (!isComplete && pollCount < maxPolls) {
					try {
						// Call RunPod stream endpoint
						const streamUrl = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/stream/${jobId}`;
						const response = await fetch(streamUrl, {
							headers: {
								Authorization: `Bearer ${RUNPOD_API_KEY}`
							}
						});

						if (!response.ok) {
							if (response.status === 404) {
								sendEvent('error', {
									error: 'Job not found',
									message: 'The requested job does not exist or has expired'
								});
								isComplete = true;
								break;
							}
							throw new Error(`RunPod API error: ${response.status}`);
						}

						const result = await response.json();

						// Log the result for debugging
						console.log(`[Stream ${jobId}] Status: ${result.status}, Output length: ${result.output?.length || 0}`);
						console.log(`[Stream ${jobId}] Full result:`, JSON.stringify(result, null, 2));

						// Handle different job statuses
						if (result.status === 'IN_QUEUE') {
							sendEvent('status', {
								status: 'queued',
								message: 'Job is waiting in queue...'
							});
						} else if (result.status === 'IN_PROGRESS') {
							// Send any streaming output
							if (result.stream && Array.isArray(result.stream)) {
								for (const streamItem of result.stream) {
									if (streamItem.status) {
										sendEvent('progress', streamItem);
									}
									if (streamItem.message) {
										sendEvent('log', { message: streamItem.message });
									}
									if (streamItem.data_chunk) {
										sendEvent('data', { chunk: streamItem.data_chunk });
									}
								}
							}
						} else if (result.status === 'COMPLETED') {
							// Job completed successfully
							console.log(`[Stream ${jobId}] Job completed, processing output...`);

							if (result.output && Array.isArray(result.output) && result.output.length > 0) {
								console.log(`[Stream ${jobId}] Processing ${result.output.length} output items`);

								// Send final output if available
								for (const outputItem of result.output) {
									console.log(`[Stream ${jobId}] Output item:`, outputItem);

									if (outputItem.data_chunk) {
										sendEvent('data', { chunk: outputItem.data_chunk });
									}
									if (outputItem.message) {
										sendEvent('log', { message: outputItem.message });
									}
									if (outputItem.status) {
										sendEvent('progress', outputItem);
									}
								}

								sendEvent('complete', {
									status: 'completed',
									message: 'Docpack generation completed successfully'
								});
							} else {
								// Output is empty - something went wrong
								console.error(`[Stream ${jobId}] Job completed but output is empty`);
								console.error(`[Stream ${jobId}] Output value:`, result.output);
								sendEvent('error', {
									error: 'No output generated',
									message: 'Job completed but produced no output. Check RunPod logs for details.'
								});
							}
							isComplete = true;
						} else if (result.status === 'FAILED') {
							// Job failed
							const errorMsg = result.error || 'Job failed without error message';
							sendEvent('error', {
								error: errorMsg,
								message: 'Docpack generation failed'
							});
							isComplete = true;
						} else if (result.status === 'CANCELLED') {
							sendEvent('error', {
								error: 'Job was cancelled',
								message: 'Docpack generation was cancelled'
							});
							isComplete = true;
						} else if (result.status === 'TIMED_OUT') {
							sendEvent('error', {
								error: 'Job timed out',
								message: 'Docpack generation timed out'
							});
							isComplete = true;
						}
					} catch (fetchError) {
						console.error('Error polling RunPod:', fetchError);
						sendEvent('error', {
							error: 'Failed to fetch job status',
							message:
								fetchError instanceof Error ? fetchError.message : 'Unknown error'
						});
						isComplete = true;
						break;
					}

					// Wait 1 second before next poll if not complete
					if (!isComplete) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						pollCount++;
					}
				}

				// If we hit max polls, send timeout error
				if (pollCount >= maxPolls) {
					sendEvent('error', {
						error: 'Polling timeout',
						message: 'Job status polling timed out after 10 minutes'
					});
				}
			} catch (error) {
				console.error('Stream error:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown streaming error';
				sendEvent('error', { error: errorMessage });
			} finally {
				controller.close();
			}
		}
	});

	// Return SSE response
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
