<script lang="ts">
	import { onMount } from "svelte";
    import ButtonStrip from "../objectEditor/ButtonStrip.svelte";
	
	export let title: string
	export let initialize: boolean = false
	export let backgroundColor = "#FFFFFF"
	export let showButtons: boolean = false
	
	let initialized = false
	let open = false
	
	onMount(() => {
		if (initialize)
			initialized = true
	})
</script>

<div class="card expander" style="--bg-card: {backgroundColor}">
	<div class="title" class:rotated={open} on:click={() => {open = !open; initialized = true}}>
		<i data-feather="chevron-down" class="icon-arrow"></i><span class="titleLabel">{title}</span>
		
		{#if showButtons}
			<ButtonStrip on:delete on:duplicate />
		{/if}
	</div>
	
	<div class="content" class:invisible={!open}>
		{#if initialized}
			<slot />
		{/if}
	</div>
</div>

<style lang="scss">
	.expander {
		margin: 1rem auto;
		
		max-width: 56rem;
	}
	
	.title {
		position: relative;
		user-select: none;
		height: 20px;
		
		.icon-arrow {
			float: left;
			
			margin-top: -1px;
			margin-right: 1px;
		}
		
		&.rotated .icon-arrow {
			transform: rotate(180deg);
		}
		
		.titleLabel {
			transform: translateY(-1px);
			display: inline-block;
		}
	}
	
	.content {
		margin-top: 8px;
	}
	
	.invisible {
		display: none;
	}
</style>
