<script lang="ts">
    import ObjectEditor from "$lib/editor/objectEditor/ObjectEditor.svelte";
    import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
    import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
    import { demangle } from "paper-mario-elfs/nameMangling";
    import { duplicateObjectInBinary, duplicateSymbolInBinary } from "paper-mario-elfs/util";
    import { VALUE_UUID, type UuidTagged } from "paper-mario-elfs/valueIdentifier";
    import Debouncer from "./Debouncer.svelte";

	export let binary: ElfBinary
	export let objects: UuidTagged[]
	export let dataType: DataType
	export let highlightedFields: WeakMap<object, string[]> = undefined
	
	let objectEditors: ObjectEditor[] = []
	let areEditorsOpen: boolean[] = []
	let countShown = 60
	
	let debouncer: Debouncer
	
	$: objectSlice = objects.slice(0, countShown)
	
	$: if (objects && debouncer) debouncer.reset()
	
	$: if (objects.find(x => x[VALUE_UUID] == undefined) != undefined) {
		console.error("Not all objects have a UUID")
		debugger
	}
	
	export function scrollIntoView(object?: UuidTagged) {
		let index = object ? objects.indexOf(object) : objects.length - 1
		
		if (index <= countShown) {
			objectEditors[index].scrollIntoView()
		} else {
			window.scrollTo({
				behavior: "smooth",
				left: 0,
				top: document.body.scrollHeight,
			})
		}
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
	
	// TODO: move this up to ElfEditor
	function createContent({ obj, fieldName, resolve, reject }: { obj: UuidTagged, fieldName: string, resolve: Function, reject: Function }) {
		// find object with symbol
		let cloneSource = objects.find(v => v[fieldName] != undefined)
		
		if (cloneSource == undefined) {
			return reject(new Error("Could not create content, there is other object with content to orientate by"))
		}
		
		let sourceSymbol = binary.findSymbol(cloneSource[fieldName].symbolName)
		let duplicateSymbol = duplicateSymbolInBinary(binary, sourceSymbol)
		
		obj[fieldName] = {
			symbolName: demangle(duplicateSymbol.name),
			children: [],
		}
		
		objects = objects
		
		resolve()
	}
	
	function titleOf(obj: any, i: number) {
		let { displayName, identifyingField } = FILE_TYPES[dataType]
		return `${displayName} ${i}: ${obj[identifyingField]}`
	}
	
	function appear(index: number) {
		if (index >= countShown - 20) {
			countShown += 40
		}
	}
</script>

<Debouncer bind:this={debouncer} autoStart={true} on:finished={() => countShown += 80} />

{#each objectSlice as obj, i (obj[VALUE_UUID])}
	<ObjectEditor bind:this={objectEditors[i]} bind:obj={obj} bind:open={areEditorsOpen[i]}
		on:open on:duplicate={() => duplicateObject(obj)} on:delete={() => deleteObject(i)}
		on:appear={() => appear(i)} on:createContent={e => createContent(e.detail)}
		binary={binary} dataType={dataType} title={titleOf(obj, i)} highlightedFields={highlightedFields?.get(obj)} />
{/each}
