<script lang="ts">
	import { hideActiveModal } from "./modal";

	export let title: string

	function close() {
		hideActiveModal(false)
	}
</script>

<div class="alert">
	<div class="closeButton" on:click={close}>
		<img src="/OrigamiWand/static/x-button.svg" alt="x" />
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
		padding: 6px;
		width: 16px;
		height: 16px;
	}
	
	.closeButton img {
		user-select: none;
		pointer-events: none;
	}
	
	h2 {
		margin-top: 0;
		margin-right: 2rem;
	}	
</style>
