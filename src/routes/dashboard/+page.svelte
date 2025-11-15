<script lang="ts">
    import type { PageData } from "../$types";

    export let data: PageData;
</script>

<div class="min-h-screen text-white">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-2">Dashboard</h1>
            <p class="text-gray-400">
                Welcome back, {data.user?.name || data.user?.login}!
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Profile Card -->
            <div
                class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
            >
                <div class="flex items-center gap-4 mb-4">
                    <img
                        src={data.user?.avatar_url}
                        alt={data.user?.login}
                        class="w-16 h-16 rounded-full border-2 border-white/20"
                    />
                    <div>
                        <h2 class="text-xl font-semibold">
                            {data.user?.name || data.user?.login}
                        </h2>
                        <p class="text-gray-400">@{data.user?.login}</p>
                    </div>
                </div>
                {#if data.user?.email}
                    <p class="text-sm text-gray-400">{data.user?.email}</p>
                {/if}
                <a
                    href="https://github.com/{data.user?.login}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm"
                >
                    View on GitHub →
                </a>
            </div>

            <!-- Stats Card -->
            <div
                class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
            >
                <h3 class="text-lg font-semibold mb-4">Quick Stats</h3>
                <div class="space-y-3">
                    <div>
                        <p class="text-gray-400 text-sm">Account ID</p>
                        <p class="font-mono text-sm">{data.user?.id}</p>
                    </div>
                    <div>
                        <p class="text-gray-400 text-sm">Member Since</p>
                        <p class="text-sm">{data.user?.login}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Additional Content Area -->
        <div
            class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
        >
            <h2 class="text-2xl font-semibold mb-4">Your Activity</h2>
            <p class="text-gray-400">
                This is your personal dashboard. More features coming soon!
            </p>
        </div>
    </div>
</div>
