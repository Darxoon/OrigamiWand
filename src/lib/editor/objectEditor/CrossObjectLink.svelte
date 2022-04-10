<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	
	import { createEventDispatcher } from "svelte";
	import ElfEditor from "../fileEditor/ElfEditor.svelte";

	const dispatch = createEventDispatcher()
	
	export let targetDataType: DataType
	export let sourceDataType: DataType
	export let label: string
	export let objectId: string
	export let tabTitle: string
	export let targetObjects: object[]
	export let binary: ElfBinary = undefined
	
	
</script>

<input type="text" value={label} readonly on:click={e => {
	let title = tabTitle.replaceAll('{id}', objectId).replaceAll('{type}', FILE_TYPES[sourceDataType].displayName)
	dispatch("open", {
		type: "window",
		title,
		shortTitle: title.replaceAll(/\[.+?\]/g, ""),
		component: ElfEditor,
		properties: {
			objectTitle: FILE_TYPES[targetDataType].displayName,
			objects: targetObjects,
			importantFieldName: FILE_TYPES[targetDataType].identifyingField,
			dataType: targetDataType,
			binary,
		}
	})
}} />

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
