<script lang="ts">
    import type { PageData } from "../$types";

    export let data: PageData;
</script>

<div class="min-h-screen text-white font-mono">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-2">Dashboard</h1>
            <p class="text-gray-400">
                Welcome back, {data.user?.name || data.user?.login}!
            </p>
        </div>

        <!-- Docpacks -->
        <div
            class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
        >
            <h2 class="text-2xl font-semibold mb-4">Your Docpacks</h2>
            <p class="text-gray-400">
                Coming soon.
            </p>
        </div>
    </div>
</div>
