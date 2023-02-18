<script lang="ts">
import { openedMenu } from '$lib/stores';

	import '../app.css';
</script>

<main on:mousedown={() => openedMenu.set(null)}>
	<slot />
</main>

<style>
	main {
		min-height: 100vh;
	}
</style>
