<script lang="ts">
	import { afterUpdate, createEventDispatcher } from "svelte";
	
	import { DataType, ElfBinary } from "$lib/elf/elfBinary";
	import { FILE_TYPES } from "$lib/elf/fileTypes";
	import { demangle, incrementName, mangleIdentifier } from "$lib/elf/nameMangling";
	
	import ObjectEditor from "./ObjectEditor.svelte"
	import SearchBar from './SearchBar.svelte';
	import type { SearchIndex } from "./searchIndex";

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
		objects = []
		dispatch('delete', { index: objects.indexOf(obj) })
	}
	
	function duplicateElfObject<T>(binary: ElfBinary, dataType: DataType, containingArray: T[], obj: T, isRootObject: boolean = true): T {
		function cloneObject<T>(dataType: DataType, obj: T): T {
			// deep clone self
			let clone = {...obj}
			Object.setPrototypeOf(clone, Object.getPrototypeOf(obj))
			
			if (isRootObject && FILE_TYPES[dataType].identifyingField == "id") {
				// @ts-ignore
				clone.id = incrementName(obj.id)
			}
			
			// deep clone children
			for (const [fieldName, fieldValue] of Object.entries(obj)) {
				const fieldType = FILE_TYPES[dataType].typedef[fieldName]
				
				if (fieldType === "pointer") {
					const childDataType = FILE_TYPES[dataType].childTypes[fieldName]
					let childObjectType = FILE_TYPES[childDataType].objectType
					
					let clonedChild = duplicateElfObject(binary, childDataType, binary.data.get(childObjectType), fieldValue, false)
					clone[fieldName] = clonedChild
				}
			}
			
			return clone
		}
		
		function cloneArray<T>(dataType: DataType, arr: T[]): T[] {
			let result = arr.map(obj => cloneObject(dataType, obj))
			console.log(result)
			return result
		}
		
		console.log('cloning', DataType[dataType], obj)
		let clone = obj instanceof Array ? cloneArray(dataType, obj) as unknown as T : cloneObject(dataType, obj)
		
		// insert clone into array
		let objectIndex = containingArray.indexOf(obj)
		containingArray.splice(objectIndex + 1, 0, clone)
		containingArray = containingArray
		
		return clone
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
</script>

<div class="editor">
	<div class="toolbar">
		<div class="card btn addObject" on:click={e => {
			dispatch('addObject', {
				obj: FILE_TYPES[dataType].instantiate(),
			})
			
			addingNewObject = true
		}}>
			<img src="/static/x-button.svg" alt="">
			Add new Object
		</div>
		<div class="card btn deleteAll" on:click={e => {
			dispatch('delete', {})
		}}>
			<img src="/static/x-button.svg" alt="">
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
		
		{#each searchResultObjects ?? objects as obj, i}
			{#if i < loadedObjectCount}
				<ObjectEditor bind:this={editorElements[objects.indexOf(obj)]} title="{objectTitle} {objects.indexOf(obj)}: {obj[importantFieldName]}" bind:obj={obj} dataType={dataType}
					highlightedFields={searchResultFields && new Set(searchResultFields.get(obj))}
					on:duplicate={() => duplicateObject(obj)} on:delete={() => deleteObject(obj)} on:open binary={binary}
					on:appear={e => {if (loadedObjectCount < i + 40) loadedObjectCount = i + 200}} />
			{/if}
		{/each}
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
		
		.btn:hover {
			background: #d2d2d2;
		}
		
		.btn:active, .btn:focus {
			background: #808080;
		}
		
		img {
			--size: 16px;
			
			pointer-events: none;
			
			transform: translateY(2px);
			
			height: var(--size);
			width: var(--size);
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
	
	.addObject img {
		transform: translateY(1.5px) rotateZ(45deg);
	}
</style>
