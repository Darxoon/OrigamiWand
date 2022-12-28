<script lang="ts">
	import { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import Expander from "$lib/editor/fileEditor/Expander.svelte";
	import { createEventDispatcher } from "svelte";
	import ElfEditor from "./ElfEditor.svelte";
	import ObjectEditor from "../objectEditor/ObjectEditor.svelte";

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
	
	{#if dataType === DataType.DataBtlSet}
		<Expander title="Special Map Names">
			<div class="maps">
				{#each binary.data.map as mapName}
					<div><pre>{mapName}</pre></div>
				{/each}
			</div>
		</Expander>
		
		{#each binary.data.main as obj}
			<Expander title={obj.symbolName.slice('wld::btl::data::s_setData_battle_'.length)} showButtons={true}>
				<div class="category">
					<div class="card set_data" on:click={e => {
						dispatch("open", {
							type: "window",
							title: `Set Data of ${obj.symbolName.slice('wld::btl::data::s_setData_battle_'.length)}`,
							shortTitle: obj.symbolName.slice('wld::btl::data::s_setData_battle_'.length),
							component: ElfEditor,
							properties: {
								objectTitle: FILE_TYPES[DataType.BtlSetCategory].displayName,
								objects: obj.objects,
								importantFieldName: FILE_TYPES[DataType.BtlSetCategory].identifyingField,
								dataType: DataType.BtlSetCategory,
								binary,
							}
						})
					}}>View Set Data (probably scripted fights)</div>
					
					{#each obj.childObjects as child, j}
						<div class="card fight" on:click={e => {
							dispatch("open", {
								type: "window",
								title: `Fight ${child.symbolName.slice('wld::btl::data::s_setElementData_'.length)}`,
								shortTitle: child.symbolName.slice('wld::btl::data::s_setElementData_'.length),
								component: ElfEditor,
								properties: {
									objectTitle: FILE_TYPES[DataType.BtlSetElement].displayName,
									objects: obj.childObjects[j].objects,
									importantFieldName: FILE_TYPES[DataType.BtlSetElement].identifyingField,
									dataType: DataType.BtlSetElement,
									metadataObject: obj.childObjects[j],
									parent: self,
									binary,
								}
							})
						}}>Open Fight "{child.symbolName.startsWith('wld::btl::data::s_setElementData_') ? child.symbolName.slice('wld::btl::data::s_setElementData_'.length) : child.symbolName}"</div>
					{/each}
				</div>
			</Expander>
		{/each}
	{/if}
	
	{#if dataType === DataType.DataConfettiTotalHoleInfo}
		<ObjectEditor title="General Information" obj={binary.data.version[0]}
				dataType={DataType.ConfettiVersion} showButtons={false} binary={binary} />
		
		<ObjectEditor title="Data Header" obj={binary.data.dataHeader[0]}
				dataType={DataType.ConfettiData} showButtons={false} binary={binary} />
		
		{#each binary.data.map as map}
			<ObjectEditor title={map.id} dataType={DataType.ConfettiMap} obj={map} on:open binary={binary} />
		{/each}
	{/if}
</div>

<style lang="scss">
	pre {
		font-family: var(--ff-monospace);
		margin: 0 0 0.5rem 0;
	}
	
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
	
	.category {
		margin-top: 1rem;
		
		.card {
			margin: 0.8rem 0 0.4rem 0;
			user-select: none;
			cursor: pointer;
			position: relative;
			
			&:nth-child(2) {
				margin-top: 1.4rem;
			}
			
			&.set_data {
				background: #92ddc4;
			}
			
			&.fight {
				background: #f0c58e;
			}
			
			&::after {
				content: "\f08e";
				display: inline-block;
				position: relative;
				top: 1px;
				margin-left: 0.8rem;
				position: absolute;
				top: auto;
				bottom: auto;
				font-size: 18px;
			}
		}
	}
	
	.search {
		flex: 1;
		cursor: not-allowed;
	}
</style>
