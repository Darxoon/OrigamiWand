<script lang="ts">
	import { PUBLIC_OW_VERSION, PUBLIC_VERSION_TIMESTAMP, PUBLIC_IS_DEV_VERSION } from "$env/static/public"
</script>

<div class="version-identifier">
	{PUBLIC_OW_VERSION}
	{#if !PUBLIC_IS_DEV_VERSION}
		<br>from {new Date(parseInt(PUBLIC_VERSION_TIMESTAMP)).toLocaleDateString()}
	{/if}
</div>

<style>
	.version-identifier {
		position: absolute;
		top: 1rem;
		right: 1rem;
		text-align: right;
	}
</style>