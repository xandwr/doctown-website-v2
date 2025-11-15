<script lang="ts">
    import type { PageData } from "../$types";

    export let data: PageData;
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

        <!-- Docpacks -->
        <div
            class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mt-8"
        >
            <h2 class="text-2xl font-semibold">Your Docpacks</h2>
            <p class="text-gray-400">
                Coming soon.
            </p>
        </div>
    </div>
</div>
