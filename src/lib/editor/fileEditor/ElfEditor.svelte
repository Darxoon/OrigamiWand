<script lang="ts">
	import { afterUpdate, createEventDispatcher } from "svelte";
	import { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES, type Instance } from "paper-mario-elfs/fileTypes";
	import ObjectEditor from "../objectEditor/ObjectEditor.svelte"
	import type { SearchIndex } from "../search/searchIndex";
    import FileToolbar from "./FileToolbar.svelte";
    import BasicObjectArray from "./objectList/BasicObjectArray.svelte";
    import type { UuidTagged } from "paper-mario-elfs/valueIdentifier";
    import { incrementName, mangleIdentifier } from "paper-mario-elfs/nameMangling";

	export let binary: ElfBinary
	export let dataType: DataType
	// TODO: will be replaced by separate tab object types for implicit objects or explicitly added objects
	export let overrideObjects: UuidTagged[] | undefined = undefined
	
	let arrayComponent: BasicObjectArray
	
	let addingNewObject = false
	let searchTerm = ""
	let searchResults: SearchIndex
	let searchResultObjects: UuidTagged[]
	
	let searchResultObjectBuffer: UuidTagged[]
	
	$: objects = overrideObjects ?? binary.data[FILE_TYPES[dataType].objectType]
	$: index = createIndex(objects)
	
	$: highlightedFields = searchResults && new WeakMap(
		searchResultObjects.map(obj => [
			obj, 
			searchResults.filter(result => result.obj == obj).map(result => result.field),
		]))
	
	$: if (searchResults) {
		searchResultObjects = []
		searchResultObjectBuffer = [...new Set(searchResults.map(result => result.obj))]
	} else {
		searchResultObjects = null
	}
	
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
		
		if (searchResultObjectBuffer) {
			searchResultObjects = searchResultObjectBuffer
			searchResultObjectBuffer = null
		}
	})
	
	function addObject() {
		objects.push(createObject(dataType))
		objects = objects
		
		addingNewObject = true
	}
	
	function createObject(dataType: DataType) {
		let object = FILE_TYPES[dataType].instantiate()
		
		let symbolFields = Object.keys(FILE_TYPES[dataType].childTypes).filter(key => FILE_TYPES[dataType].typedef[key] == "symbol")
		
		for (const fieldName of symbolFields) {
			let fieldType = FILE_TYPES[dataType].childTypes[fieldName]
			let dataDivision = FILE_TYPES[fieldType].objectType
			console.log('symbol', fieldName, DataType[fieldType], dataDivision)
			
			let lastBaseObject = binary.data[dataDivision].findLast(value => typeof value === "object" && value.symbolName != undefined)
			
			if (!lastBaseObject)
				continue
			
			let symbolName = incrementName(lastBaseObject.symbolName)
			
			let childObject: any = { symbolName }
			
			if ('item' in lastBaseObject) {
				childObject.item = FILE_TYPES[fieldType].instantiate()
			}
			
			if ('children' in lastBaseObject) {
				childObject.children = []
			}
			
			object[fieldName] = childObject
			
			// also create symbol
			let baseSymbolIndex = binary.findSymbolIndex(lastBaseObject.symbolName)
			let newSymbol = binary.symbolTable[baseSymbolIndex].clone()
			newSymbol.name = mangleIdentifier(symbolName)
			binary.symbolTable.splice(baseSymbolIndex + 1, 0, newSymbol)
		}
		
		return object
	}
	
	function deleteAll() {
		objects.length = 0
		objects = objects
	}
</script>

<div class="editor">
	<!-- TODO: if objects contain symbol references, it's important that there is always one object left -->
	<!-- Ask for confirmation in this case when pressing Delete All -->
	<FileToolbar on:add={addObject} on:clear={deleteAll} searchIndex={index} bind:searchTerm={searchTerm} bind:searchResults={searchResults} />
	
	<div class="listing" style="--content-height: {objects?.length * 61}px;">
		{#if searchResults}
			<div class="resultlabel">Showing {searchResultObjects.length} results
				(out of {objects.length} objects):</div>
			
			<BasicObjectArray on:open binary={binary} dataType={dataType} objects={searchResultObjects} highlightedFields={highlightedFields} />
		{:else}
			<BasicObjectArray on:open bind:this={arrayComponent} binary={binary} dataType={dataType} objects={objects} />
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
