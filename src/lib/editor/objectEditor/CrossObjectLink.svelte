<script lang="ts">
	import { DataType, type ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	
	import { createEventDispatcher, onMount } from "svelte";
	import ElfEditor from "../fileEditor/ElfEditor.svelte";

	const dispatch = createEventDispatcher()
	
	export let targetDataType: DataType
	export let sourceDataType: DataType
	export let label: string
	export let objectId: string
	export let tabTitle: string
	export let targetObjects: any[] | {symbolName: string, children: any[]}
	export let binary: ElfBinary = undefined
	
	onMount(() => {
		if (tabTitle == undefined) {
			console.error(`Missing tabTitle metadata on link to ${DataType[targetDataType]} from ${DataType[sourceDataType]}`)
		}
	})
	
	function click() {
		let title = tabTitle.replaceAll('{id}', objectId).replaceAll('{type}', FILE_TYPES[sourceDataType].displayName)
		let objects: any[]
		
		if (!(targetObjects instanceof Array) && "children" in targetObjects) {
			objects = (targetObjects as any).children
		} else {
			objects = targetObjects
		}
		
		dispatch("open", {
			type: "window",
			title,
			shortTitle: title.replaceAll(/\[.+?\]/g, ""),
			component: ElfEditor,
			properties: {
				objectTitle: FILE_TYPES[targetDataType].displayName,
				objects: objects,
				importantFieldName: FILE_TYPES[targetDataType].identifyingField,
				dataType: targetDataType,
				binary,
			}
		})
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
