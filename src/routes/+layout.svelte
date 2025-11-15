<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import Navbar from "$components/Navbar.svelte";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar {data} />
<div class="px-2">
	<slot />
</div>
