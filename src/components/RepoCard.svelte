<script lang="ts">
    import { goto } from "$app/navigation";

    export let repo: any;

    let showModal = false;
    let cardElement: HTMLDivElement;
    let isGenerating = false;

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function handleCardClick(e: MouseEvent) {
        e.preventDefault();
        showModal = !showModal;
    }

    function handleClickOutside(e: MouseEvent) {
        if (
            showModal &&
            cardElement &&
            !cardElement.contains(e.target as Node)
        ) {
            showModal = false;
        }
    }

    function visitGitHub() {
        window.open(repo.html_url, "_blank", "noopener,noreferrer");
        showModal = false;
    }

    async function generateDocpack() {
        if (isGenerating) return;

        isGenerating = true;
        showModal = false;

        try {
            // Call the backend to start the docpack generation
            const response = await fetch("/api/docpack/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner: repo.owner.login,
                    repo: repo.name,
                    branch: repo.default_branch || "main",
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Failed to start generation: ${error.error}`);
                isGenerating = false;
                return;
            }

            const data = await response.json();

            // Navigate to the docpack progress page
            goto(`/docpack/${data.jobId}`);
        } catch (error) {
            console.error("Error starting docpack generation:", error);
            alert("Failed to start docpack generation. Please try again.");
            isGenerating = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div bind:this={cardElement} class="relative p-1 h-48">
    <button
        on:click={handleCardClick}
        class="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 transition-all duration-200 hover:scale-105 hover:border-blue-400/50 flex flex-col w-full h-full text-left"
        class:ring-2={showModal}
        class:ring-blue-400={showModal}
    >
        <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-lg truncate flex-1 mr-2">
                {repo.name}
            </h3>
            {#if repo.private === true}
                <span
                    class="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded"
                >
                    Private
                </span>
            {:else}
                <span
                    class="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded"
                >
                    Public
                </span>
            {/if}
        </div>

        {#if repo.description}
            <p class="text-gray-400 text-sm mb-3 line-clamp-2 flex-1">
                {repo.description}
            </p>
        {:else}
            <p class="text-gray-500 text-sm italic mb-3 flex-1">
                No description
            </p>
        {/if}

        <div class="flex items-center gap-4 text-xs text-gray-400 mt-auto">
            {#if repo.language}
                <span class="flex items-center gap-1">
                    <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                    {repo.language}
                </span>
            {/if}
            <span>⭐ {repo.stargazers_count}</span>
            <span class="ml-auto" title={`Updated: ${repo.updated_at}`}>
                {formatDate(repo.updated_at)}
            </span>
        </div>
    </button>

    {#if showModal}
        <div
            class="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden"
        >
            <button
                on:click={visitGitHub}
                class="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-2 border-b border-white/10"
            >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                    />
                </svg>
                <span>Visit on GitHub</span>
            </button>
            <button
                on:click={generateDocpack}
                class="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-2"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <span>Generate Docpack</span>
            </button>
        </div>
    {/if}
</div>
