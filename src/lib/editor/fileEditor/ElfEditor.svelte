<script lang="ts">
	import { afterUpdate, createEventDispatcher } from "svelte";
	import { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import ObjectEditor from "../objectEditor/ObjectEditor.svelte"
	import type { SearchIndex } from "../search/searchIndex";
    import FileToolbar from "./FileToolbar.svelte";
    import BasicObjectArray from "./objectList/BasicObjectArray.svelte";
    import type { UuidTagged } from "paper-mario-elfs/valueIdentifier";

	const dispatch = createEventDispatcher()
	
	export let binary: ElfBinary = undefined
	export let dataType: DataType | undefined = undefined
	
	let arrayComponent: BasicObjectArray
	
	let addingNewObject = false
	let searchTerm = ""
	let searchResults: SearchIndex
	
	$: objects = binary.data[FILE_TYPES[dataType].objectType]
	$: index = createIndex(objects)
	
	
	$: searchResultObjects = searchResults && [...new Set(searchResults.map(result => result.obj))]
	$: highlightedFields = searchResults && new WeakMap(
		searchResultObjects.map(obj => [
			obj, 
			searchResults.filter(result => result.obj == obj).map(result => result.field),
		]))
	
	export function collapseAll() {
		arrayComponent.collapseAll()
	}
	
	export function expandAll() {
		arrayComponent.expandAll()
	}
	
	function createIndex(objects: UuidTagged[]) {
		let index: SearchIndex = []
		
		for (const obj of objects) {
			for (const key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] == 'string') {
					index.push({
						obj,
						field: key,
						value: obj[key],
					})
				}
			}
		}
		
		return index
	}
	
	afterUpdate(() => {
		// @ts-ignore
		feather.replace()
		
		if (addingNewObject) {
			addingNewObject = false
			arrayComponent.scrollIntoView(objects[objects.length - 1])
		}
	})
	
	function addObject() {
		dispatch('addObject', {
			obj: FILE_TYPES[dataType].instantiate(),
		})
		
		addingNewObject = true
	}
	
	function deleteAll() {
		dispatch('delete', {})
	}
</script>

<div class="editor">
	<FileToolbar on:add={addObject} on:clear={deleteAll} searchIndex={index} bind:searchTerm={searchTerm} bind:searchResults={searchResults} />
	
	<div class="listing" style="--content-height: {objects?.length * 61}px;">
		{#if searchResults}
			<div class="resultlabel">Showing {searchResultObjects.length} results
				(out of {objects.length} objects):</div>
			
			<BasicObjectArray binary={binary} dataType={dataType} objects={searchResultObjects} highlightedFields={highlightedFields} />
		{:else}
			<BasicObjectArray bind:this={arrayComponent} binary={binary} dataType={dataType} objects={objects} />
		{/if}
	</div>
	
	<!-- TODO: use a dedicated special elf editor instead -->
	{#if dataType === DataType.Maplink}
		<ObjectEditor title={`Maplink Header (Advanced)`} bind:obj={binary.data.main[0]} 
			dataType={DataType.MaplinkHeader} showButtons={false} binary={binary} />
	{/if}
</div>

<style lang="scss">
	.resultlabel {
		font-size: 17pt;
		color: white;
		max-width: 56rem;
		margin: -0.8rem auto 1.6rem auto;
	}
	
	.listing {
		min-height: var(--content-height);
	}
</style>
