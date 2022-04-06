<script lang="ts">
	import { DataType, ElfBinary } from "$lib/elf/elfBinary";
	import { FILE_TYPES } from "$lib/elf/fileTypes";
	import { demangle, incrementName, mangleIdentifier } from "$lib/elf/nameMangling";
	import { afterUpdate, createEventDispatcher, onMount } from "svelte";
	import ObjectEditor from "./ObjectEditor.svelte"

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
	
	function deleteObject(index: number) {
		console.log('yeeah')
		objects = []
		dispatch('delete', { index })
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
		
		return clone
	}
	
	function duplicateObject(index: number) {
		objectToClone = objects[index]
		backupObjects = objects
		objects = []
	}
	
	let backupObjects: any[] = undefined
	let objectToClone = undefined
	
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
	})
	
	let addingNewObject = false
	
	afterUpdate(() => {
		if (addingNewObject) {
			addingNewObject = false
			
			editorElements[objects.length - 1]?.scrollIntoView()
		}
	})
</script>

<div class="editor">
	<div class="toolbar">
		<div class="card btn addObject" on:click={e => {
			dispatch('addObject', {
				obj: FILE_TYPES[dataType].instantiate(),
			})
			
			addingNewObject = true
		}}>
			<img src="/OrigamiWand/static/x-button.svg" alt="">
			Add new Object
		</div>
		<div class="card btn deleteAll" on:click={e => {
			dispatch('delete', {})
		}}>
			<img src="/OrigamiWand/static/x-button.svg" alt="">
			Delete all Objects
		</div>
		<div class="card search">
			<i class="fa fa-search" aria-hidden="true"></i>
			Search Coming Soon...
		</div>
	</div>
		
	<!-- <div class="toolbar">Yes</div> -->
	
	{#if metadataObject}
		<ObjectEditor title="General Information" bind:obj={metadataObject} dataType={DataType.Metadata} 
			on:valueChanged={e => {if (parent && parent.applyChangedValue) parent.applyChangedValue()}} showButtons={false} />
	{/if}
	
	<div class="listing" style="--content-height: {objects?.length * 61}px;">
		{#each objects as obj, i}
			{#if i < loadedObjectCount}
				<ObjectEditor bind:this={editorElements[i]} title="{objectTitle} {i}: {obj[importantFieldName]}" bind:obj={obj} dataType={dataType}
					on:duplicate={() => duplicateObject(i)} on:delete={() => deleteObject(i)} on:open binary={binary}
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
	
	.listing {
		min-height: var(--content-height);
	}
	
	.addObject img {
		transform: translateY(1.5px) rotateZ(45deg);
	}
	
	.search {
		flex: 1;
		cursor: not-allowed;
	}
</style>
