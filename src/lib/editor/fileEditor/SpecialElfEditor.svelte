<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
    import { DataTypeExtension, dataTypeExtensions } from "./dataTypeExtensions";
    import InnerIndexPageEditor from "./InnerIndexPageEditor.svelte";
	
	export let dataType: DataType
	export let binary: ElfBinary
	export let fileName: string
	
	let inner: InnerIndexPageEditor
	
	export function collapseAll() {
		inner.collapseAll()
	}
	
	export function expandAll() {
		inner.expandAll()
	}
</script>

{#if dataTypeExtensions(DataTypeExtension.HasComplexEditor, dataType)}
	<InnerIndexPageEditor bind:dataType={dataType} bind:binary={binary} bind:fileName={fileName} 
			bind:this={inner} on:open />
{:else}
	<div>This file does not have an editor yet.</div>
{/if}
