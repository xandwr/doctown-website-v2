<script lang="ts">
	import type { Docpack } from "$lib/stores/docpacks";

	export let docpack: Docpack;
	export let onClick: () => void;

	function getStatusColor(status: string) {
		switch (status) {
			case "completed":
				return "bg-green-500/20 text-green-400 border-green-500/50";
			case "failed":
				return "bg-red-500/20 text-red-400 border-red-500/50";
			case "processing":
				return "bg-blue-500/20 text-blue-400 border-blue-500/50";
			case "queued":
				return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
			default:
				return "bg-gray-500/20 text-gray-400 border-gray-500/50";
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
</script>

<button
	on:click={onClick}
	class="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 transition-all duration-200 hover:scale-105 hover:border-blue-400/50 flex flex-col w-full h-full text-left"
>
	<div class="flex items-start justify-between mb-3">
		<h3 class="font-semibold text-lg truncate flex-1 mr-2">
			{docpack.repoName}
		</h3>
		<span
			class="text-xs px-2 py-1 rounded border {getStatusColor(
				docpack.status,
			)} capitalize"
		>
			{docpack.status}
		</span>
	</div>

	<p class="text-gray-400 text-sm mb-3">
		<span class="text-gray-500">Owner:</span>
		{docpack.repoOwner}
		<span class="text-gray-500 mx-2">•</span>
		<span class="text-gray-500">Branch:</span>
		{docpack.branch}
	</p>

	{#if docpack.status === "processing" || docpack.status === "queued"}
		<!-- Progress Bar -->
		<div class="mb-3">
			<div class="flex items-center justify-between mb-1">
				<span class="text-xs text-gray-400">Progress</span>
				<span class="text-xs text-gray-400">{docpack.progress}%</span>
			</div>
			<div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
				<div
					class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 {docpack.status ===
					'queued'
						? 'animate-pulse'
						: ''}"
					style="width: {docpack.progress}%"
				></div>
			</div>
		</div>
	{/if}

	{#if docpack.status === "completed"}
		<div class="text-sm text-gray-400 mb-2">
			<span class="text-green-400">✓</span>
			{docpack.jsonlData.length} files processed
		</div>
	{/if}

	{#if docpack.errorMessage}
		<div class="text-sm text-red-400 mb-2 truncate">
			{docpack.errorMessage}
		</div>
	{/if}

	<div class="flex items-center gap-4 text-xs text-gray-400 mt-auto">
		<span title="Created at">📅 {formatDate(docpack.createdAt)}</span>
		{#if docpack.completedAt}
			<span title="Completed at">✓ {formatDate(docpack.completedAt)}</span
			>
		{/if}
	</div>
</button>
