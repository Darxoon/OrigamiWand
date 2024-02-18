<script lang="ts">
	import { afterUpdate } from "svelte";

	import Alert from "./Alert.svelte";
    import { nonnativeButton } from "$lib/nonnativeButton";

	export let title: string
	export let selectedIndex = 0
	export let tabNames: string[]
	
	let content: HTMLDivElement
	
	afterUpdate(() => {
		for (let i = 0; i < content.children.length; i++) {
			let child = content.children[i]
			
			if (selectedIndex == i) {
				child.classList.remove("visibilityHidden")
			} else {
				child.classList.add("visibilityHidden")
			}
		}
	})
</script>

<Alert title={title}>
	<ul class="tab_bar">
		{#each tabNames as tabName, i}
			<li class:active={selectedIndex == i} use:nonnativeButton={() => selectedIndex = i}>{tabName}</li>
		{/each}
	</ul>
	
	<div class="content" bind:this={content}>
		<slot />
	</div>
</Alert>

<style lang="scss">
	.tab_bar {
		--border-radius: 6px;
		
		display: flex;
		
		padding: 0;
		
		list-style: none;
		background: #dadada;
		border-radius: var(--border-radius);
		
		li {
			width: 100%;
			text-align: center;
			padding: 6px;
			// background: gray;
			border-radius: var(--border-radius);
			user-select: none;
			transition: background-color 0.1s;
		}
		
		li:hover {
			background: #c3c3c3;
		}
		
		li.active, li:active {
			background: #aeaeae;
		}
	}
	
	.content {
		position: relative;
		display: grid;
		grid-template-columns: 1;
		grid-template-rows: 1;
	}
	
	.content > :global(*) {
		grid-area: 1 / 1;
	}
</style>
