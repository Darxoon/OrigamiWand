<script lang="ts">
	import { onMount } from "svelte";
	import type { Property } from "$lib/elf/fileTypes";
	import Alert from "./Alert.svelte";
	import StringViewer from "./StringViewer.svelte";

	let wrapper: HTMLDivElement
	
	let allNotes = Object.entries(localStorage).filter(arr => arr[0].endsWith('.description'))
	
	onMount(() => {
		wrapper.focus()
	})
</script>

<Alert title="All User Notes">
	<div class="wrapper" bind:this={wrapper}>
		{#each allNotes as [id, content], i}
			<div class="element">
				<b>{id}:</b>
				<StringViewer text={content} inline={true} />
			</div>
		{/each}
	</div>
</Alert>

<style>
	.wrapper {
		overflow: auto;
		max-height: 70vh;
		
		min-width: 32rem;
		min-height: 14rem;
	}
	.element {
		margin: 0 1rem 1rem 0;
		padding: 6px 12px;
		
		border-radius: 4px;
		
		background: #eaeaea;
	}
	.element:last-child {
		margin-bottom: 0;
	}
</style>
