<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { Docpack } from "$lib/stores/docpacks";
	import { docpackStore } from "$lib/stores/docpacks";

	export let docpack: Docpack;
	export let onClose: () => void;

	let eventSource: EventSource | null = null;
	let logsContainer: HTMLDivElement;

	// Subscribe to store to get reactive updates
	$: currentDocpack = $docpackStore.docpacks.find((d) => d.id === docpack.id) || docpack;

	// Auto-scroll to bottom when new logs arrive
	$: if (logsContainer && currentDocpack.logs.length > 0) {
		setTimeout(() => {
			logsContainer.scrollTop = logsContainer.scrollHeight;
		}, 100);
	}

	onMount(() => {
		// Only connect to stream if job is not completed or failed
		if (currentDocpack.status === "queued" || currentDocpack.status === "processing") {
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
				console.error("Parse error:", e);
				return null;
			}
		}

		eventSource.addEventListener("status", (e: MessageEvent) => {
			const data = safeJsonParse("status", e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: data.status,
			});
			if (data.message) {
				docpackStore.addLog(docpack.id, `[STATUS] ${data.message}`);
			}
		});

		eventSource.addEventListener("progress", (e: MessageEvent) => {
			const data = safeJsonParse("progress", e.data);
			if (!data) return;

			if (data.progress !== undefined) {
				docpackStore.update(docpack.id, {
					progress: data.progress,
				});
			}
			if (data.message) {
				docpackStore.addLog(docpack.id, data.message);
			}
		});

		eventSource.addEventListener("log", (e: MessageEvent) => {
			const data = safeJsonParse("log", e.data);
			if (!data) return;

			if (data.message) {
				docpackStore.addLog(docpack.id, data.message);
			}
		});

		eventSource.addEventListener("complete", (e: MessageEvent) => {
			const data = safeJsonParse("complete", e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: "completed",
				progress: 100,
				completedAt: new Date().toISOString(),
				s3Key: data.s3Key,
				docpackUrl: data.docpackUrl,
			});
			docpackStore.addLog(
				docpack.id,
				`[SUCCESS] ${data.message || "Docpack generation completed!"}`,
			);
			if (data.s3Key) {
				docpackStore.addLog(docpack.id, `[INFO] S3 Key: ${data.s3Key}`);
			}
			if (data.docpackUrl) {
				docpackStore.addLog(docpack.id, `[INFO] Download: ${data.docpackUrl}`);
			}
			eventSource?.close();
		});

		eventSource.addEventListener("error", (e: MessageEvent) => {
			const data = safeJsonParse("error", e.data);
			if (!data) return;

			docpackStore.update(docpack.id, {
				status: "failed",
				errorMessage: data.error || "Unknown error occurred",
			});
			docpackStore.addLog(
				docpack.id,
				`[ERROR] ${data.error || "Unknown error"}`,
			);
			eventSource?.close();
		});

		eventSource.onerror = () => {
			if (currentDocpack.status !== "completed" && currentDocpack.status !== "failed") {
				docpackStore.addLog(currentDocpack.id, "[ERROR] Connection lost");
			}
			eventSource?.close();
		};
	}

	onDestroy(() => {
		eventSource?.close();
	});

	function downloadDocpack() {
		if (currentDocpack.docpackUrl) {
			window.open(currentDocpack.docpackUrl, '_blank');
		}
	}

	function deleteDocpack() {
		if (confirm("Are you sure you want to delete this docpack?")) {
			docpackStore.remove(docpack.id);
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			onClose();
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
	on:click={handleBackdropClick}
	on:keydown={handleBackdropKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- Modal Content -->
	<div
		class="bg-gray-900 border border-white/20 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
	>
		<!-- Header -->
		<div
			class="bg-white/5 px-6 py-4 border-b border-white/20 flex items-center justify-between"
		>
			<div>
				<h2 class="text-2xl font-bold">{currentDocpack.repoName}</h2>
				<p class="text-gray-400 text-sm">
					{currentDocpack.repoOwner}/{currentDocpack.repoName} ({currentDocpack.branch})
				</p>
			</div>
			<button
				on:click={onClose}
				class="text-gray-400 hover:text-white transition-colors p-2"
				aria-label="Close modal"
			>
				<svg
					class="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
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
						class="w-3 h-3 rounded-full {currentDocpack.status ===
						'completed'
							? 'bg-green-500'
							: currentDocpack.status === 'failed'
								? 'bg-red-500'
								: 'bg-blue-500 animate-pulse'}"
					></div>
					<span class="text-lg font-semibold capitalize"
						>{currentDocpack.status}</span
					>
				</div>
				<span class="text-xl font-bold">{currentDocpack.progress}%</span>
			</div>

			<!-- Progress Bar -->
			<div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
				<div
					class="h-full transition-all duration-500 {currentDocpack.status ===
					'completed'
						? 'bg-green-500'
						: currentDocpack.status === 'failed'
							? 'bg-red-500'
							: 'bg-linear-to-r from-blue-500 to-purple-500'}"
					style="width: {currentDocpack.progress}%"
				></div>
			</div>
		</div>

		<!-- Content (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-6 space-y-4">
			<!-- Error Message -->
			{#if currentDocpack.errorMessage}
				<div
					class="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
				>
					<p class="text-red-400">
						<strong>Error:</strong>
						{currentDocpack.errorMessage}
					</p>
				</div>
			{/if}

			<!-- Logs Terminal -->
			<div
				class="bg-black/50 border border-white/20 rounded-lg overflow-hidden"
			>
				<div
					class="bg-white/5 px-4 py-2 border-b border-white/20 flex items-center justify-between"
				>
					<span class="font-semibold">Build Logs</span>
					<span class="text-sm text-gray-400"
						>{currentDocpack.logs.length} lines</span
					>
				</div>
				<div
					bind:this={logsContainer}
					class="p-4 font-mono text-sm max-h-64 overflow-y-auto"
				>
					{#if currentDocpack.logs.length === 0}
						<p class="text-gray-500 italic">Waiting for logs...</p>
					{:else}
						{#each currentDocpack.logs as log}
							<div
								class="mb-1 {log.includes('[ERROR]')
									? 'text-red-400'
									: 'text-gray-300'}"
							>
								{log}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Download Docpack -->
			{#if currentDocpack.status === 'completed' && currentDocpack.docpackUrl}
				<div
					class="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-lg p-6"
				>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-xl font-semibold text-green-400 mb-2">
								✓ Docpack Ready!
							</h3>
							<p class="text-gray-300 text-sm">
								Your documentation package has been generated and is ready to download.
							</p>
							{#if currentDocpack.s3Key}
								<p class="text-gray-500 text-xs mt-1 font-mono">
									{currentDocpack.s3Key}
								</p>
							{/if}
						</div>
						<button
							on:click={downloadDocpack}
							class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
						>
							<svg
								class="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Download .docpack
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer Actions -->
		<div
			class="bg-white/5 px-6 py-4 border-t border-white/20 flex items-center justify-between"
		>
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
