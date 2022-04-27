<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import InnerSpecialSvelteEditor from "./InnerSpecialSvelteEditor.svelte";
	
	export let dataType: DataType
	export let binary: ElfBinary
	
	let inner: InnerSpecialSvelteEditor
	
	export function collapseAll() {
		inner.collapseAll()
	}
	
	export function expandAll() {
		inner.expandAll()
	}
</script>

<InnerSpecialSvelteEditor bind:dataType={dataType} bind:binary={binary} bind:this={inner} self={inner} on:addObject on:delete on:open />
