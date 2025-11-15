<script lang="ts">
	export let data: any;

	async function handleLogout() {
		await fetch('/auth/logout', {
			method: 'POST'
		});
		window.location.href = '/';
	}
</script>

<div class="p-2 flex flex-row w-full justify-between items-center border-b border-white/20">
	<a href="/" class="text-white text-2xl hover:text-neutral-200">doctown</a>

	{#if data.user}
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<img src={data.user.avatar_url} alt={data.user.login} class="w-8 h-8 rounded-full" />
				<span class="text-white">{data.user.name || data.user.login}</span>
			</div>
			<button
				on:click={handleLogout}
				class="bg-white p-2 rounded-2xl hover:bg-gray-300 text-black"
			>
				Logout
			</button>
		</div>
	{:else}
		<a href="/auth/login" class="bg-white p-2 rounded-2xl hover:bg-gray-300 text-black">
			Login with GitHub
		</a>
	{/if}
</div>
