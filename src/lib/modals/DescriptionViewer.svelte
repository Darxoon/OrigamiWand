<script lang="ts">
	import { onMount } from "svelte";
	import type { Property } from "paper-mario-elfs/fileTypes";
	import Alert from "../modal/Alert.svelte";
	import StringViewer from "../modal/StringViewer.svelte";

	export let typeMetadata: {[fieldName: string]: Property}
	
	let wrapper: HTMLDivElement
	
	onMount(() => {
		wrapper.focus()
	})
</script>

<Alert title="All Field Descriptions">
	<div class="wrapper" bind:this={wrapper}>
		{#each Object.entries(typeMetadata) as [fieldName, metadata], i}
			{#if metadata.description}
				<div class="element">
					<b>{fieldName}:</b>
					<StringViewer text={metadata.description} inline={true} />
				</div>
			{/if}
		{/each}
	</div>
</Alert>

<style>
	.wrapper {
		overflow: auto;
		max-height: 70vh;
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
