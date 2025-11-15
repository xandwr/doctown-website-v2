<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Docpack } from '$lib/stores/docpacks';
	import { docpackStore } from '$lib/stores/docpacks';

	export let docpack: Docpack;
	export let onClose: () => void;

	let eventSource: EventSource | null = null;
	let logsContainer: HTMLDivElement;

	// Auto-scroll to bottom when new logs arrive
	$: if (logsContainer && docpack.logs.length > 0) {
		setTimeout(() => {
			logsContainer.scrollTop = logsContainer.scrollHeight;
		}, 100);
	}

	onMount(() => {
		// Only connect to stream if job is not completed or failed
		if (docpack.status === 'queued' || docpack.status === 'processing') {
			connectToStream();
		}
	});

	function connectToStream() {
		const streamUrl = `/api/docpack/stream/${docpack.id}`;
		eventSource = new EventSource(streamUrl);

		function safeJsonParse(eventType: string, data: string) {
			try {
				return JSON.parse(data);
			} catch (e) {
				console.error(`Failed to parse ${eventType} event data:`, data);
				console.error('Parse error:', e);
				return null;
			}
		}

		eventSource.addEventListener('status', (e) => {
			const data = safeJsonParse('status', e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: data.status
			});
			if (data.message) {
				docpackStore.addLog(docpack.id, `[STATUS] ${data.message}`);
			}
		});

		eventSource.addEventListener('progress', (e) => {
			const data = safeJsonParse('progress', e.data);
			if (!data) return;

			if (data.progress !== undefined) {
				docpackStore.update(docpack.id, {
					progress: data.progress
				});
			}
			if (data.message) {
				docpackStore.addLog(docpack.id, data.message);
			}
		});

		eventSource.addEventListener('log', (e) => {
			const data = safeJsonParse('log', e.data);
			if (!data) return;

			if (data.message) {
				docpackStore.addLog(docpack.id, data.message);
			}
		});

		eventSource.addEventListener('data', (e) => {
			const data = safeJsonParse('data', e.data);
			if (!data) return;

			if (data.chunk) {
				docpackStore.addJsonlData(docpack.id, data.chunk);
			}
		});

		eventSource.addEventListener('complete', (e) => {
			const data = safeJsonParse('complete', e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: 'completed',
				progress: 100,
				completedAt: new Date().toISOString()
			});
			docpackStore.addLog(docpack.id, `[SUCCESS] ${data.message || 'Docpack generation completed!'}`);
			eventSource?.close();
		});

		eventSource.addEventListener('error', (e) => {
			const data = safeJsonParse('error', e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: 'failed',
				errorMessage: data.error || 'Unknown error occurred'
			});
			docpackStore.addLog(docpack.id, `[ERROR] ${data.error || 'Unknown error'}`);
			eventSource?.close();
		});

		eventSource.onerror = () => {
			if (docpack.status !== 'completed' && docpack.status !== 'failed') {
				docpackStore.addLog(docpack.id, '[ERROR] Connection lost');
			}
			eventSource?.close();
		};
	}

	onDestroy(() => {
		eventSource?.close();
	});

	function downloadJsonl() {
		const content = docpack.jsonlData.join('\n');
		const blob = new Blob([content], { type: 'application/x-ndjson' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${docpack.repoName}-${docpack.id}.jsonl`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const content = docpack.jsonlData.join('\n');
		navigator.clipboard.writeText(content);
		alert('JSONL data copied to clipboard!');
	}

	function deleteDocpack() {
		if (confirm('Are you sure you want to delete this docpack?')) {
			docpackStore.remove(docpack.id);
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
	on:click={handleBackdropClick}
	role="dialog"
	aria-modal="true"
>
	<!-- Modal Content -->
	<div
		class="bg-gray-900 border border-white/20 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
		on:click|stopPropagation
	>
		<!-- Header -->
		<div class="bg-white/5 px-6 py-4 border-b border-white/20 flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold">{docpack.repoName}</h2>
				<p class="text-gray-400 text-sm">
					{docpack.repoOwner}/{docpack.repoName} ({docpack.branch})
				</p>
			</div>
			<button
				on:click={onClose}
				class="text-gray-400 hover:text-white transition-colors p-2"
				aria-label="Close modal"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Status Bar -->
		<div class="bg-white/5 px-6 py-3 border-b border-white/20">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-3">
					<div
						class="w-3 h-3 rounded-full {docpack.status === 'completed'
							? 'bg-green-500'
							: docpack.status === 'failed'
								? 'bg-red-500'
								: 'bg-blue-500 animate-pulse'}"
					></div>
					<span class="text-lg font-semibold capitalize">{docpack.status}</span>
				</div>
				<span class="text-xl font-bold">{docpack.progress}%</span>
			</div>

			<!-- Progress Bar -->
			<div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
				<div
					class="h-full transition-all duration-500 {docpack.status === 'completed'
						? 'bg-green-500'
						: docpack.status === 'failed'
							? 'bg-red-500'
							: 'bg-gradient-to-r from-blue-500 to-purple-500'}"
					style="width: {docpack.progress}%"
				></div>
			</div>
		</div>

		<!-- Content (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-6 space-y-4">
			<!-- Error Message -->
			{#if docpack.errorMessage}
				<div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
					<p class="text-red-400">
						<strong>Error:</strong>
						{docpack.errorMessage}
					</p>
				</div>
			{/if}

			<!-- Logs Terminal -->
			<div class="bg-black/50 border border-white/20 rounded-lg overflow-hidden">
				<div
					class="bg-white/5 px-4 py-2 border-b border-white/20 flex items-center justify-between"
				>
					<span class="font-semibold">Build Logs</span>
					<span class="text-sm text-gray-400">{docpack.logs.length} lines</span>
				</div>
				<div
					bind:this={logsContainer}
					class="p-4 font-mono text-sm max-h-64 overflow-y-auto"
				>
					{#if docpack.logs.length === 0}
						<p class="text-gray-500 italic">Waiting for logs...</p>
					{:else}
						{#each docpack.logs as log}
							<div class="mb-1 {log.includes('[ERROR]') ? 'text-red-400' : 'text-gray-300'}">
								{log}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- JSONL Output -->
			{#if docpack.jsonlData.length > 0}
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
					<div class="p-4 font-mono text-xs max-h-64 overflow-y-auto bg-black/30">
						<p class="text-gray-400 mb-2">{docpack.jsonlData.length} lines of JSONL data</p>
						{#each docpack.jsonlData.slice(0, 10) as line}
							<div class="mb-1 text-gray-300 truncate">{line}</div>
						{/each}
						{#if docpack.jsonlData.length > 10}
							<p class="text-gray-500 italic mt-2">
								... and {docpack.jsonlData.length - 10} more lines (download to see all)
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer Actions -->
		<div class="bg-white/5 px-6 py-4 border-t border-white/20 flex items-center justify-between">
			<button
				on:click={deleteDocpack}
				class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded transition-all text-red-400"
			>
				Delete Docpack
			</button>
			<button
				on:click={onClose}
				class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded transition-all"
			>
				Close
			</button>
		</div>
	</div>
</div>
