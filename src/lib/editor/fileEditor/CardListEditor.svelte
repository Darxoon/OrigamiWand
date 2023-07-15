<script lang="ts">
    import { DataType, type ElfBinary } from "paper-mario-elfs/elfBinary";
    import type { UuidTagged } from "paper-mario-elfs/valueIdentifier";
    import ElfEditor from "./cardListEditor/LinearEditor.svelte";
    import InnerIndexPageEditor from "./cardListEditor/InnerIndexPageEditor.svelte";
    import { DataTypeExtension, dataTypeExtensions } from "./dataTypeExtensions";

	export let binary: ElfBinary
	export let dataType: DataType
	export let tabVisible: boolean
	
	export let overrideObjects: UuidTagged[] = undefined
	export let fileName: string = undefined
	
	const nonStandardDataTypes = new Set([
		DataType.DataConfettiTotalHoleInfo,
	])
	
	let inner: InnerIndexPageEditor | ElfEditor
	
	export function collapseAll() {
		inner.collapseAll
	}
	
	export function expandAll() {
		inner.expandAll()
	}
</script>

{#if dataTypeExtensions(DataTypeExtension.HasComplexEditor, dataType)}
	<InnerIndexPageEditor bind:this={inner} bind:binary={binary} bind:dataType={dataType} fileName={fileName} on:open />
{:else if nonStandardDataTypes.has(dataType)}
	<div>This file does not have an editor yet.</div>
{:else}
	<ElfEditor bind:this={inner} bind:binary={binary} bind:dataType={dataType} overrideObjects={overrideObjects} tabVisible={tabVisible} on:open />
{/if}
