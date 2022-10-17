<script lang="ts">
	import { afterUpdate, createEventDispatcher } from "svelte";
	
	import { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import { demangle, incrementName, mangleIdentifier } from "paper-mario-elfs/nameMangling";
	
	import ObjectEditor from "../objectEditor/ObjectEditor.svelte"
	import SearchBar from '../search/SearchBar.svelte';
	import type { SearchIndex } from "../search/searchIndex";
	import { duplicateElfObject } from "paper-mario-elfs/util";

	const dispatch = createEventDispatcher()
	
	export let objectTitle: string
	export let objects: object[] = []
	export let headerObject: object = undefined
	export let dataType: DataType | undefined = undefined
	export let importantFieldName: string | undefined = undefined
	export let metadataObject: any = undefined
	export let parent: any = undefined
	export let binary: ElfBinary = undefined
	
	let editorElements: ObjectEditor[] = []
	// let afterUpdateObjects = undefined
	
	let loadedObjectCount = 120
	
	export function collapseAll() {
		editorElements.forEach(editor => editor.open = false)
	}
	
	export function expandAll() {
		editorElements.forEach(editor => editor.open = true)
	}
	
	function deleteObject(obj: object) {
		let index = objects.indexOf(obj)
		objects = []
		dispatch('delete', { index })
	}
	
	
	function duplicateObject(obj: object) {
		objectToClone = obj
		backupObjects = objects
		objects = []
	}
	
	let backupObjects: any[] = undefined
	let objectToClone = undefined
	
	let addingNewObject = false
	
	$: index = createIndex(objects)
	
	function createIndex(objects: object[]) {
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
		
		if (objectToClone) {
			console.warn('cloning', DataType[dataType], objectToClone.id)
			let clone = duplicateElfObject(binary, dataType, backupObjects, objectToClone)
			objects = backupObjects
			
			if (dataType >= DataType.DataNpcModel && dataType < DataType.DataModelEnd) {
				binary.modelSymbolReference.set(clone, clone.id)
				// duplicate all symbols related to this
				// reverse loop to prevent duplicated symbols from being duplicated again
				console.log('dasf')
				for (let i = binary.symbolTable.length - 1; i >= 0; i--) {
					const symbol = binary.symbolTable[i]
					let match = demangle(symbol.name).match(/^wld::fld::data:::(\w+)(_(?:model_files|state|anime)\w*)$/)
					if (match && match[1] == binary.modelSymbolReference.get(objectToClone)) {
						console.log(demangle(symbol.name))
						let clonedSymbol = symbol.clone()
						clonedSymbol.name = mangleIdentifier(`wld::fld::data:::${clone.id}${match[2]}`)
						binary.symbolTable.splice(i + 1, 0, clonedSymbol)
					}
				}
			}
			
			objectToClone = undefined
		}
		
		if (addingNewObject) {
			addingNewObject = false
			
			editorElements[objects.length - 1]?.scrollIntoView()
		}
	})
	
	let searchResults: SearchIndex
	$: searchResultObjects = searchResults && [...new Set(searchResults.map(result => result.obj))]
	$: searchResultFields = searchResults && new WeakMap(
		searchResultObjects.map(obj => [
			obj, 
			searchResults.filter(result => result.obj == obj).map(result => result.field),
		]))
	
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
	<div class="toolbar">
		<div class="card btn" on:click={addObject}>
			<div class="icon"><i data-feather="plus"></i></div>
			<span>Add new Object</span>
		</div>
		<div class="card btn" on:click={deleteAll}>
			<div class="icon"><i data-feather="x"></i></div>
			Delete all Objects
		</div>
		<SearchBar index={index} bind:results={searchResults} />
	</div>
		
	<!-- <div class="toolbar">Yes</div> -->
	
	{#if metadataObject}
		<ObjectEditor title="General Information" bind:obj={metadataObject} dataType={DataType.Metadata} 
			on:valueChanged={e => {if (parent && parent.applyChangedValue) parent.applyChangedValue()}} showButtons={false} />
	{/if}
	
	<div class="listing" style="--content-height: {objects?.length * 61}px;">
		{#if searchResultObjects}
			<div class="resultlabel">Showing {searchResultObjects.length} results
				(out of {objects.length} objects):</div>
		{/if}
		
		{#if searchResults}
			{#each searchResultObjects as obj, i}
				{#if i < loadedObjectCount}
					<ObjectEditor bind:this={editorElements[objects.indexOf(obj)]} bind:obj={obj} dataType={dataType}
						title="{objectTitle} {objects.indexOf(obj)}: {obj[importantFieldName]}"
						highlightedFields={searchResultFields && new Set(searchResultFields.get(obj))}
						on:duplicate={() => duplicateObject(obj)} on:delete={() => deleteObject(obj)} on:open binary={binary}
						on:appear={e => {if (loadedObjectCount < i + 40) loadedObjectCount = i + 200}} />
				{/if}
			{/each}
		{:else}
			{#each objects as obj, i}
				{#if i < loadedObjectCount}
					<ObjectEditor bind:this={editorElements[objects.indexOf(obj)]} title="{objectTitle} {objects.indexOf(obj)}: {obj[importantFieldName]}" bind:obj={obj} dataType={dataType}
						highlightedFields={searchResultFields && new Set(searchResultFields.get(obj))}
						on:duplicate={() => duplicateObject(obj)} on:delete={() => deleteObject(obj)} on:open binary={binary}
						on:appear={e => {if (loadedObjectCount < i + 40) loadedObjectCount = i + 200}} />
				{/if}
			{/each}
		{/if}
	</div>
	
	{#if dataType === DataType.Maplink}
		<ObjectEditor bind:this={editorElements[objects.length]} title={`Maplink Header (Advanced)`} bind:obj={headerObject} 
			dataType={DataType.MaplinkHeader} showButtons={false} />
	{/if}
</div>

<style lang="scss">
	.toolbar {
		/* display: flex; */
		margin: 1rem auto 2rem auto;
		max-width: 54rem;
		
		display: flex;
		// transform: translateX(-12px);
		
		user-select: none;
				
		div {
			margin-right: 0.5rem;
		}
		
		div:last-child {
			margin-right: 0;
		}
		
		.btn {
			height: 20px;
			
			.icon {
				float: left;
				height: 24px;
				width: 24px;
				// margin: -2px 0 0 0;
				margin: -1px 0 0 -5px;
			}
			
			span {
				margin-top: -1px;
			}
		}
		
		.btn:hover {
			background: #d2d2d2;
		}
		
		.btn:active, .btn:focus {
			background: #808080;
		}
	}
	
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
