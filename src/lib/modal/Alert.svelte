<script lang="ts">
    import { onMount } from "svelte";
	import { hideActiveModal } from "./modal";
    import { nonnativeButton } from "$lib/nonnativeButton";

	export let title: string

	function close() {
		hideActiveModal(false)
	}
	
	onMount(() => {
		// @ts-ignore
		feather.replace()
	})
</script>

<div class="alert">
	<div class="closeButton" use:nonnativeButton={close}>
		<i data-feather="x"></i>
	</div>
	
	<h2>{title}</h2>
	<div>
		<slot />
	</div>
</div>

<style>
	:root {
		--alert-font-size: 12pt;
	}
	
	.alert {
		position: relative;
		font-size: var(--alert-font-size);
	}
	
	.closeButton {
		position: absolute;
		right: 0;
	}
	
	h2 {
		margin-top: 0;
		margin-right: 2rem;
	}	
</style>
