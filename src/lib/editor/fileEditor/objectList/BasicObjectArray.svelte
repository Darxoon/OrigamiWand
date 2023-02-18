<script lang="ts">
    import ObjectEditor from "$lib/editor/objectEditor/ObjectEditor.svelte";
    import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
    import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
    import { duplicateObjectInBinary } from "paper-mario-elfs/util";
    import { VALUE_UUID, type UuidTagged } from "paper-mario-elfs/valueIdentifier";

	export let binary: ElfBinary
	export let objects: UuidTagged[]
	export let dataType: DataType
	export let highlightedFields: WeakMap<object, string[]> = undefined
	
	let objectEditors: ObjectEditor[] = []
	let areEditorsOpen: boolean[] = []
	
	$: if (objects.find(x => x[VALUE_UUID] == undefined) != undefined) {
		console.error("Not all objects have a UUID")
		debugger
	}
	
	export function scrollIntoView(object?: UuidTagged) {
		let index = object ? objects.indexOf(object) : objects.length - 1
		objectEditors[index].scrollIntoView()
	}
	
	export function collapseAll() {
		areEditorsOpen.fill(false)
		areEditorsOpen = areEditorsOpen
	}
	
	export function expandAll() {
		areEditorsOpen.fill(true)
		areEditorsOpen = areEditorsOpen
	}
	
	function duplicateObject(obj: UuidTagged) {
		duplicateObjectInBinary(binary, dataType, objects, obj)
		objects = objects
	}
	
	function deleteObject(index: number) {
		objects.splice(index, 1)
		objects = objects
	}
	
	function titleOf(obj: any, i: number) {
		let { displayName, identifyingField } = FILE_TYPES[dataType]
		return `${displayName} ${i}: ${obj[identifyingField]}`
	}
</script>

{#each objects as obj, i (obj[VALUE_UUID])}
	<ObjectEditor bind:this={objectEditors[i]} bind:obj={obj} bind:open={areEditorsOpen[i]}
		on:open on:duplicate={() => duplicateObject(obj)} on:delete={() => deleteObject(i)}
		binary={binary} dataType={dataType} title={titleOf(obj, i)} highlightedFields={highlightedFields?.get(obj)} />
{/each}