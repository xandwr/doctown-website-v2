<script lang="ts">
    import type { PageData } from "../$types";
    import { onMount } from "svelte";

    export let data: PageData;

    type Tab = "docpacks" | "repositories";
    let activeTab: Tab = "repositories";
    let repositories: any[] = [];
    let loading = false;
    let error = "";

    onMount(async () => {
        await fetchRepositories();
    });

    async function fetchRepositories() {
        loading = true;
        error = "";
        try {
            const response = await fetch("/api/repos");
            if (response.ok) {
                repositories = await response.json();
            } else {
                const errorData = await response.json();
                error = `Failed to load repositories (${response.status})`;
                console.error("API Error:", response.status, errorData);
            }
        } catch (e) {
            error = "Error loading repositories";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
</script>

<div class="min-h-screen text-white font-mono py-8">
    <div class="max-w-6xl mx-auto">
        <div class="">
            <h1 class="text-3xl font-bold">Dashboard</h1>

            <p class="text-gray-400 text-lg mt-1">
                Welcome back, {data.user?.name || data.user?.login}!
            </p>
        </div>

        <div class="mt-4">
            <a href="/" class="p-2 bg-neutral-600 rounded-xl">⟵ Go Home </a>
        </div>

        <!-- Tabbed Interface -->
        <div
            class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mt-8 overflow-hidden"
        >
            <!-- Tab Navigation -->
            <div class="flex border-b border-white/20">
                <button
                    class="flex-1 px-8 py-4 text-lg font-semibold transition-all duration-200 {activeTab ===
                    'docpacks'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'}"
                    on:click={() => (activeTab = "docpacks")}
                >
                    Your Docpacks
                </button>
                <button
                    class="flex-1 px-8 py-4 text-lg font-semibold transition-all duration-200 {activeTab ===
                    'repositories'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'}"
                    on:click={() => (activeTab = "repositories")}
                >
                    Your Repositories
                </button>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
                {#if activeTab === "docpacks"}
                    <!-- Docpacks Content -->
                    <div class="text-center py-12">
                        <h3 class="text-xl font-semibold mb-2">
                            No Docpacks Yet
                        </h3>
                        <p class="text-gray-400">
                            Your uploaded docpacks will appear here.
                        </p>
                    </div>
                {:else if activeTab === "repositories"}
                    <!-- Repositories Content -->
                    {#if loading}
                        <div class="text-center py-12">
                            <p class="text-gray-400">Loading repositories...</p>
                        </div>
                    {:else if error}
                        <div class="text-center py-12">
                            <p class="text-red-400">{error}</p>
                        </div>
                    {:else if repositories.length === 0}
                        <div class="text-center py-12">
                            <p class="text-gray-400">No repositories found.</p>
                        </div>
                    {:else}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2"
                        >
                            {#each repositories as repo}
                                <a
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 transition-all duration-200 hover:scale-105 hover:border-blue-400/50 flex flex-col"
                                >
                                    <div class="flex items-start justify-between mb-2">
                                        <h3
                                            class="font-semibold text-lg truncate flex-1 mr-2"
                                        >
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
                                        <p
                                            class="text-gray-400 text-sm mb-3 line-clamp-2 flex-1"
                                        >
                                            {repo.description}
                                        </p>
                                    {:else}
                                        <p
                                            class="text-gray-500 text-sm italic mb-3 flex-1"
                                        >
                                            No description
                                        </p>
                                    {/if}

                                    <div
                                        class="flex items-center gap-4 text-xs text-gray-400 mt-auto"
                                    >
                                        {#if repo.language}
                                            <span class="flex items-center gap-1">
                                                <span
                                                    class="w-3 h-3 rounded-full bg-blue-500"
                                                ></span>
                                                {repo.language}
                                            </span>
                                        {/if}
                                        <span>⭐ {repo.stargazers_count}</span>
                                        <span
                                            class="ml-auto"
                                            title={`Updated: ${repo.updated_at}`}
                                        >
                                            {formatDate(repo.updated_at)}
                                        </span>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>
