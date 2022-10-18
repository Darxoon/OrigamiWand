<script lang="ts">
	import { dataDivisions, DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import { createEventDispatcher } from "svelte";
	import ElfEditor from "./ElfEditor.svelte";

	const dispatch = createEventDispatcher()
	
	export let dataType: DataType
	export let binary: ElfBinary
	export let fileName: string
	export let self
	
	let editorElements = []
	
	export function collapseAll() {
		editorElements.forEach(editor => editor.open = false)
	}
	
	export function expandAll() {
		editorElements.forEach(editor => editor.open = true)
	}
	
	export function applyChangedValue(instance: any) {
		binary = binary
	}
	
	function addObject() {
		dispatch('addObject', {
			obj: FILE_TYPES[dataType].instantiate(),
		})
	}
	
	function deleteAll() {
		dispatch('delete', {})
	}
	
	let items = Object.entries({
		"Models": {
			dataType: DataType.UiModel,
			dataDivision: dataDivisions.model,
		},
		"Messages": {
			dataType: DataType.UiMsg,
			dataDivision: dataDivisions.msg,
		},
		"Shops": {
			dataType: DataType.UiShop,
			dataDivision: dataDivisions.shop,
		},
		"Sea Map": {
			dataType: DataType.UiSeaMap,
			dataDivision: dataDivisions.seaEntry,
		},
		"Menus": {
			dataType: DataType.UiMenu,
			dataDivision: dataDivisions.menu,
		},
		"Announcements": {
			dataType: DataType.UiAnnouncement,
			dataDivision: dataDivisions.announcement,
		},
		"Announcement Excludes": {
			dataType: DataType.UiAnnouncementExclude,
			dataDivision: dataDivisions.announcementExclude,
		},
	})
</script>

<div class="editor">
	<div class="toolbar">
		<div class="card btn" on:click={addObject}>
			<div class="icon" style="margin-top: -1;"><i data-feather="plus"></i></div>
			<span>Add new Object</span>
		</div>
		<div class="card btn" on:click={deleteAll}>
			<div class="icon"><i data-feather="x"></i></div>
			Delete all Objects
		</div>
		<div class="card search">
			Search Coming Soon...
		</div>
	</div>
	
	{#each items as [name, {dataType, dataDivision}]}
		<div class="card link" on:click={e => {
			dispatch("open", {
				type: "window",
				title: `${name} (${fileName})`,
				component: ElfEditor,
				properties: {
					objects: binary.data[dataDivision],
					dataType: dataType,
					importantFieldName: FILE_TYPES[dataType].identifyingField,
					parent: self,
					binary,
				}
			})
		}}>
			<div style="dislay: flex; user-select: none">
				{name}
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.toolbar {
		margin: 1rem auto 2rem auto;
		max-width: 54rem;
		
		display: flex;
		
		user-select: none;
				
		div {
			margin-right: 0.5rem;
		}
		
		.btn {
			height: 20px;
			
			.icon {
				float: left;
				height: 24px;
				width: 24px;
				margin: -2px 0 0 0;
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
	
	.link {
		margin: 1rem auto;
		max-width: 56rem;
	}
	
	.search {
		flex: 1;
		cursor: not-allowed;
	}
</style>
