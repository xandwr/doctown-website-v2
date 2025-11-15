<script lang="ts">
    import type { PageData } from "../$types";
    import { onMount } from "svelte";
    import RepoCard from "$components/RepoCard.svelte";
    import DocpackCard from "$components/DocpackCard.svelte";
    import DocpackModal from "$components/DocpackModal.svelte";
    import { docpackStore } from "$lib/stores/docpacks";
    import type { Docpack } from "$lib/stores/docpacks";

    export let data: PageData;

    type Tab = "docpacks" | "repositories";
    let activeTab: Tab = "repositories";
    let repositories: any[] = [];
    let filteredRepositories: any[] = [];
    let loading = false;
    let error = "";
    let selectedDocpack: Docpack | null = null;

    // Subscribe to docpack store
    $: docpacks = $docpackStore.docpacks;

    // Filter repositories to exclude ones with docpacks
    $: filteredRepositories = repositories.filter(
        (repo) => !docpackStore.hasDocpack(repo.owner.login, repo.name)
    );

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

    function openDocpackModal(docpack: Docpack) {
        selectedDocpack = docpack;
    }

    function closeDocpackModal() {
        selectedDocpack = null;
    }

    function handleDocpackCreated() {
        // Switch to docpacks tab when a new docpack is created
        activeTab = "docpacks";
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
                    {#if docpacks.length === 0}
                        <div class="text-center py-12">
                            <h3 class="text-xl font-semibold mb-2">
                                No Docpacks Yet
                            </h3>
                            <p class="text-gray-400">
                                Generate a docpack from your repositories to see it here.
                            </p>
                            <button
                                on:click={() => (activeTab = "repositories")}
                                class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                            >
                                Browse Repositories
                            </button>
                        </div>
                    {:else}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 p-4"
                        >
                            {#each docpacks as docpack}
                                <DocpackCard {docpack} onClick={() => openDocpackModal(docpack)} />
                            {/each}
                        </div>
                    {/if}
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
                    {:else if filteredRepositories.length === 0}
                        <div class="text-center py-12">
                            {#if repositories.length === 0}
                                <p class="text-gray-400">No repositories found.</p>
                            {:else}
                                <h3 class="text-xl font-semibold mb-2">
                                    All Repositories Have Docpacks!
                                </h3>
                                <p class="text-gray-400">
                                    You've created docpacks for all your repositories.
                                </p>
                                <button
                                    on:click={() => (activeTab = "docpacks")}
                                    class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                                >
                                    View Docpacks
                                </button>
                            {/if}
                        </div>
                    {:else}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 p-4"
                        >
                            {#each filteredRepositories as repo}
                                <RepoCard {repo} onDocpackCreated={handleDocpackCreated} />
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Docpack Modal -->
{#if selectedDocpack}
    <DocpackModal docpack={selectedDocpack} onClose={closeDocpackModal} />
{/if}
