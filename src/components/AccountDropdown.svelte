<script lang="ts">
    import { onMount } from "svelte";

    export let user: any;
    export let onLogout: () => void;

    let isOpen = false;
    let dropdownRef: HTMLDivElement;

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });
</script>

<div class="relative" bind:this={dropdownRef}>
    <button
        on:click={toggleDropdown}
        class="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
        <img
            src={user.avatar_url}
            alt={user.login}
            class="w-8 h-8 rounded-full"
        />
        <span class="text-white">{user.name || user.login}</span>
        <svg
            class="w-4 h-4 text-white transition-transform {isOpen
                ? 'rotate-180'
                : ''}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if isOpen}
        <div
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
        >
            <a
                href="https://github.com/{user.login}"
                target="_blank"
                rel="noopener noreferrer"
                class="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
            >
                GitHub Profile
            </a>
            <a
                href="/dashboard"
                class="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
            >
                Dashboard
            </a>
            <hr class="my-1 border-gray-200" />
            <button
                on:click={onLogout}
                class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors"
            >
                Logout
            </button>
        </div>
    {/if}
</div>
