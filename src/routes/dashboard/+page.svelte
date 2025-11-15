<script lang="ts">
    import type { PageData } from "../$types";
    import { onMount } from "svelte";
    import RepoCard from "$components/RepoCard.svelte";

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
            class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mt-8"
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
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 p-4"
                        >
                            {#each repositories as repo}
                                <RepoCard {repo} />
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>
