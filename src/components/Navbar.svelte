<script lang="ts">
	import AccountDropdown from "./AccountDropdown.svelte";

	export let data: any;

	async function handleLogout() {
		await fetch("/auth/logout", {
			method: "POST",
		});
		window.location.href = "/";
	}
</script>

<div
	class="p-2 flex flex-row w-full justify-between items-center border-b border-white/20 font-mono"
>
	<a href="/" class="text-white text-2xl hover:text-neutral-200">doctown</a>

	{#if data.user}
		<AccountDropdown user={data.user} onLogout={handleLogout} />
	{:else}
		<a
			href="/auth/login"
			class="bg-white p-2 rounded-2xl hover:bg-gray-300 text-black"
		>
			Login with GitHub
		</a>
	{/if}
</div>
