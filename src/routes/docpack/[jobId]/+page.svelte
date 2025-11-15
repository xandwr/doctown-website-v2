<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	const jobId = $page.params.jobId;

	let logs: string[] = [];
	let status: string = 'connecting';
	let progress: number = 0;
	let eventSource: EventSource | null = null;
	let jsonlData: string[] = [];
	let errorMessage: string = '';

	onMount(() => {
		// Connect to SSE stream
		const streamUrl = `/api/docpack/stream/${jobId}`;
		eventSource = new EventSource(streamUrl);

		eventSource.addEventListener('status', (e) => {
			const data = JSON.parse(e.data);
			status = data.status;
			if (data.message) {
				logs = [...logs, `[STATUS] ${data.message}`];
			}
		});

		eventSource.addEventListener('progress', (e) => {
			const data = JSON.parse(e.data);
			if (data.progress !== undefined) {
				progress = data.progress;
			}
			if (data.message) {
				logs = [...logs, data.message];
			}
		});

		eventSource.addEventListener('log', (e) => {
			const data = JSON.parse(e.data);
			if (data.message) {
				logs = [...logs, data.message];
			}
		});

		eventSource.addEventListener('data', (e) => {
			const data = JSON.parse(e.data);
			if (data.chunk) {
				jsonlData = [...jsonlData, data.chunk];
			}
		});

		eventSource.addEventListener('complete', (e) => {
			const data = JSON.parse(e.data);
			status = 'completed';
			progress = 100;
			logs = [...logs, `[SUCCESS] ${data.message || 'Docpack generation completed!'}`];
			eventSource?.close();
		});

		eventSource.addEventListener('error', (e) => {
			const data = JSON.parse(e.data);
			status = 'failed';
			errorMessage = data.error || 'Unknown error occurred';
			logs = [...logs, `[ERROR] ${errorMessage}`];
			eventSource?.close();
		});

		eventSource.onerror = () => {
			if (status !== 'completed' && status !== 'failed') {
				status = 'disconnected';
				errorMessage = 'Connection to server lost';
				logs = [...logs, '[ERROR] Connection lost'];
			}
			eventSource?.close();
		};
	});

	onDestroy(() => {
		eventSource?.close();
	});

	function downloadJsonl() {
		const content = jsonlData.join('\n');
		const blob = new Blob([content], { type: 'application/x-ndjson' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `docpack-${jobId}.jsonl`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const content = jsonlData.join('\n');
		navigator.clipboard.writeText(content);
		alert('JSONL data copied to clipboard!');
	}

	function goBack() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
	<div class="max-w-6xl mx-auto">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold mb-2">Docpack Generation</h1>
				<p class="text-gray-400">Job ID: {jobId}</p>
			</div>
			<button
				on:click={goBack}
				class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
			>
				← Back to Dashboard
			</button>
		</div>

		<!-- Status Card -->
		<div class="bg-white/5 border border-white/20 rounded-lg p-6 mb-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-3">
					<div
						class="w-4 h-4 rounded-full {status === 'completed'
							? 'bg-green-500'
							: status === 'failed' || status === 'disconnected'
								? 'bg-red-500'
								: 'bg-blue-500 animate-pulse'}"
					></div>
					<span class="text-lg font-semibold capitalize">{status}</span>
				</div>
				<span class="text-2xl font-bold">{progress}%</span>
			</div>

			<!-- Progress Bar -->
			<div class="w-full bg-white/10 rounded-full h-3 overflow-hidden">
				<div
					class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 {status ===
					'completed'
						? 'bg-green-500'
						: status === 'failed'
							? 'bg-red-500'
							: ''}"
					style="width: {progress}%"
				></div>
			</div>
		</div>

		<!-- Error Message -->
		{#if errorMessage}
			<div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
				<p class="text-red-400">
					<strong>Error:</strong>
					{errorMessage}
				</p>
			</div>
		{/if}

		<!-- Logs Terminal -->
		<div class="bg-black/50 border border-white/20 rounded-lg overflow-hidden mb-6">
			<div class="bg-white/5 px-4 py-2 border-b border-white/20 flex items-center justify-between">
				<span class="font-semibold">Build Logs</span>
				<span class="text-sm text-gray-400">{logs.length} lines</span>
			</div>
			<div class="p-4 font-mono text-sm max-h-96 overflow-y-auto">
				{#if logs.length === 0}
					<p class="text-gray-500 italic">Waiting for logs...</p>
				{:else}
					{#each logs as log}
						<div class="mb-1 {log.includes('[ERROR]') ? 'text-red-400' : 'text-gray-300'}">
							{log}
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- JSONL Output -->
		{#if jsonlData.length > 0}
			<div class="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
				<div
					class="bg-white/5 px-4 py-2 border-b border-white/20 flex items-center justify-between"
				>
					<span class="font-semibold">JSONL Output</span>
					<div class="flex gap-2">
						<button
							on:click={copyToClipboard}
							class="px-3 py-1 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded transition-all"
						>
							Copy
						</button>
						<button
							on:click={downloadJsonl}
							class="px-3 py-1 text-sm bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded transition-all"
						>
							Download
						</button>
					</div>
				</div>
				<div class="p-4 font-mono text-xs max-h-96 overflow-y-auto bg-black/30">
					<p class="text-gray-400 mb-2">{jsonlData.length} lines of JSONL data</p>
					{#each jsonlData.slice(0, 10) as line}
						<div class="mb-1 text-gray-300 truncate">{line}</div>
					{/each}
					{#if jsonlData.length > 10}
						<p class="text-gray-500 italic mt-2">
							... and {jsonlData.length - 10} more lines (download to see all)
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
