<script lang="ts">
	import type { MenuStripEntry } from "$lib/types";
	import { openedMenu } from "$lib/stores";

	export let name: string
	export let items: MenuStripEntry[] = []
	
	$: shown = ($openedMenu) == name
	
	let li: HTMLLIElement
	
	function updateOpenedMenu() {
		if ($openedMenu != null)
			openedMenu.set(name)
	}
	
	function nop() {
		
	}
	
	function open(e) {
		if ($openedMenu == name) {
			li.blur()
			e.preventDefault()
		}
		
		openedMenu.set($openedMenu == name ? null : name)
	}
</script>

<li role="button" tabindex="0" on:mouseenter={updateOpenedMenu} bind:this={li}
	on:mousedown|stopPropagation={open} on:keypress|stopPropagation={open}>
	
	{name}
	
	<div on:mousedown|stopPropagation={nop} class="menu" class:shown={shown}>
		<ul>
			{#each items as item}
				<li class="menu_item" role="button" tabindex="0"
						on:click={e => {openedMenu.set(null); item.onClick(e);}}
						on:keypress={e => {openedMenu.set(null); item.onClick(e);}}>{item.name}</li>
			{/each}
		</ul>
	</div>
</li>

<style>
	li {
		position: relative;
		padding: 0 0.9rem 6px 0.9rem;
		
		border-radius: 6px;
		
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}
	
	li:hover {
		background: #d9d9d9;
	}
	
	.menu_item:active {
		background: #b3b3b3;
	}
	
	.menu {
		position: absolute;
		
		left: -0.0rem;
		top: 1.8rem;
		
		display: none;
		z-index: 2;
	}
	
	.menu.shown {
		display: block;
	}
	
	.menu ul {
		padding: 0.6rem;
		min-width: 12rem;
		
		border: 1px solid #b5b5b5;
		background: white;
		list-style-type: none;
		
		box-shadow: 0px 5px 7px 0px #0000002e, -1px 5px 12px 5px #0000001a;
	}
</style>
