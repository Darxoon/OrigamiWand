<script lang="ts">
	import MenuStripItem from "./menu/MenuStripItem.svelte";
	import type { MenuStripEntry } from "./types";
	
	export let menu: {title: string, items: MenuStripEntry[]}[] = []
</script>

<div>
	<div class="title_card">
		<div class="title">
			<h1>Origami Wand BETA</h1>
			<p>Paper&nbsp;Mario: The Origami King Editor</p>
		</div>
		<ul class="menu_strip">
			{#each menu as item}
				<span>
					<MenuStripItem name={item.title} items={item.items} />
				</span>
			{/each}
		</ul>
	</div>
</div>

<style lang="scss">
	.title_card {
		padding: 0.2rem 1rem calc(1rem - 10px) 1rem;
		border-radius: 1rem;
		
		display: inline-block;
		
		:last-child {
			margin: 0;
		}
		
		.title {
			display: flex;
			margin-bottom: 1rem;
			
			h1 {
				margin-bottom: 0;
				font-size: 32pt;
			}
			
			p {
				margin: auto 0 auto 2rem;
				font-size: 15pt;
				transform: translateY(2px);
			}
		}
		
		.menu_strip {
			padding: 0;
			display: flex;
			flex-direction: row;
			list-style-type: none;
		}
	}
	
	
	/* .menu_strip span {
		margin-right: 1.8rem;
	} */
</style>
