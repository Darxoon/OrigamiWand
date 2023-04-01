<script lang="ts">
	import { DataType, type ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	
	import { createEventDispatcher, onMount } from "svelte";
	import ElfEditor from "../fileEditor/ElfEditor.svelte";

	const dispatch = createEventDispatcher()
	
	export let targetObjects: any[] | {symbolName: string, children: any[]}
	export let binary: ElfBinary
	export let sourceDataType: DataType
	export let targetDataType: DataType
	export let objectId: string
	export let tabTitle: string
	export let error: any = undefined
	
	$: label = targetObjects != undefined
		? `Click to open (${length(targetObjects)} item${length(targetObjects) < 2 ? '' : 's'})`
		: error == undefined ? `Click to create new content` : 'Could not create content (Error)'
		
	
	onMount(() => {
		if (tabTitle == undefined) {
			console.error(`Missing tabTitle metadata on link to ${DataType[targetDataType]} from ${DataType[sourceDataType]}`)
		}
	})
	
	function click() {
		if (targetObjects != undefined)
			openContent()
		else 
			createContent()
	}
	
	function createContent() {
		dispatch('create')
	}
	
	function openContent() {
		let title = tabTitle.replaceAll('{id}', objectId).replaceAll('{type}', FILE_TYPES[sourceDataType].displayName)
		let objects: any[]
		
		if (!(targetObjects instanceof Array) && "children" in targetObjects) {
			objects = (targetObjects as any).children
		} else {
			objects = targetObjects
		}
		
		console.log('opening', objects)
		
		dispatch("open", {
			type: "window",
			title,
			shortTitle: title.replaceAll(/\[.+?\]/g, ""),
			component: ElfEditor,
			properties: {
				binary,
				dataType: targetDataType,
				overrideObjects: objects,
			}
		})
	}
	
	function length(arrayOrObj) {
		if (typeof arrayOrObj == "string") {
			// this shouldn't happen
			// TODO: this is a btlSet thing again
			debugger
		}
		if (arrayOrObj instanceof Array)
			return arrayOrObj.length
		else if ("children" in arrayOrObj)
			return arrayOrObj.children.length
		else {
			throw new Error(`Argument is not an array, ${arrayOrObj}`)
		}
	}
</script>

<input type="text" value={label} readonly on:click={click} />

<style lang="scss">
	input {
		border: 1px solid #8f8f9d;
		border-radius: 4px;
		padding: 5px 2px 3px 1px;
		margin-left: 2px;

		font-family: var(--ff-monospace);
		font-size: 14px;

		color: #0000EE;
		text-decoration: underline;
		
		cursor: pointer;

		width: 100%;
	}
</style>
