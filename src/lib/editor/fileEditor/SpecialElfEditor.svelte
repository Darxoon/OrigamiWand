<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
    import { DataTypeExtension, dataTypeExtensions } from "./dataTypeExtensions";
    import InnerDataUiEditor from "./InnerDataUiEditor.svelte";
	import InnerSpecialSvelteEditor from "./InnerSpecialSvelteEditor.svelte";
	
	export let dataType: DataType
	export let binary: ElfBinary
	export let fileName: string
	
	let inner
	
	export function collapseAll() {
		inner.collapseAll()
	}
	
	export function expandAll() {
		inner.expandAll()
	}
</script>

{#if dataTypeExtensions(DataTypeExtension.HasComplexEditor, dataType)}
	<InnerDataUiEditor bind:dataType={dataType} bind:binary={binary} bind:fileName={fileName} 
			bind:this={inner} self={inner} on:delete on:open />
{:else}
	<InnerSpecialSvelteEditor bind:dataType={dataType} bind:binary={binary}
			bind:this={inner} self={inner} on:delete on:open />
{/if}
