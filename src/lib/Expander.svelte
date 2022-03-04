<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";

	import { Colors } from "./color";

	const dispatch = createEventDispatcher()
	
	export let title: string
	export let initialize: boolean = false
	export let backgroundColor = Colors.WHITE
	export let showButtons: boolean = false
	
	let initialized = false
	let open = false
	
	onMount(() => {
		if (initialize)
			initialized = true
	})
</script>

<div class="card expander" style="--bg-card: {backgroundColor}">
	<div class="title" on:click={() => {open = !open; initialized = true}}>
		<img src={open ? '/static/up.svg' : '/static/down.svg'} alt="V" class="expander_icon"><span>{title}</span>
		{#if showButtons}<div class="buttons">
			<div class="duplicate" on:click|stopPropagation={() => {
				dispatch("duplicate")
			}}><i class="fa fa-clone"></i></div>
			<div class="delete" on:click|stopPropagation={() => {
				dispatch("delete")
			}}><img src="/static/x-button.svg" alt="x"></div>
		</div>{/if}
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
		
		.expander_icon {
			position: relative;
			
			user-select: none;
			pointer-events: none;
			
			height: 1rem;
			width: 1rem;
			
			margin-right: 4px;
			
			top: 2px;
		}
	}
	
	.title {
		position: relative;
		
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		
		.buttons {
			position: absolute;
			display: flex;
			
			top: 0;
			right: 0;
			
			margin-right: 6px;
			
			div {
				--size: 18px;
				
				height: var(--size);
				width: var(--size);
				margin-left: 2px;
			}
			
			img {
				margin-top: 2px;
			}
			
			.spinner img {
				animation: rotating 0.4s linear infinite;
			}
			
		}
	}
	
	.content {
		margin-top: 8px;
	}
	
	.invisible {
		display: none;
	}
</style>
