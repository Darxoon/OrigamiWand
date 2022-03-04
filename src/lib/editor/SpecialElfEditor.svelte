<script lang="ts">
	import type { DataType, ElfBinary } from "$lib/elf/elfBinary";
	import InnerSpecialSvelteEditor from "./InnerSpecialSvelteEditor.svelte";
	
	export let dataType: DataType
	export let binary: ElfBinary
	
	export function collapseAll() {
		child.collapseAll()
	}
	
	export function expandAll() {
		child.expandAll()
	}
	
	// function deleteObject(index: number) {
	// 	console.log('yeeah')
	// 	objects = []
	// 	dispatch('delete', { index })
	// }
	
	// function duplicateObject(index: number) {
	// 	// let newObjects = [...objects]
	// 	let newObject = {...objects[index]}
	// 	// newObjects.splice(index, 0, newObject)
	// 	// afterUpdateObjects = newObjects
	// 	objects = []
		
	// 	dispatch('addObject', {
	// 		index: index,
	// 		obj: newObject,
	// 	})
	// }
	
	let child
</script>

<InnerSpecialSvelteEditor bind:dataType={dataType} bind:binary={binary} bind:this={child} self={child} on:addObject on:delete on:open />
