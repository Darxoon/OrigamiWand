<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { createEventDispatcher, onMount } from "svelte";
    import { DataTypeExtension, dataTypeExtensions } from "./dataTypeExtensions";
	import ElfEditor from "./ElfEditor.svelte";
    import { nonnativeButton } from "$lib/nonnativeButton";

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
	
	onMount(() => {
		// @ts-ignore
		feather.replace()
	})
	
	$: items = Object.entries(dataTypeExtensions(DataTypeExtension.ComplexEditorCategory, dataType))
</script>

<div class="editor">
	{#each items as [name, {dataType, label}]}
		<div class="card link" use:nonnativeButton={() => {
			dispatch("open", {
				type: "window",
				title: `${name} (${fileName})`,
				component: ElfEditor,
				properties: {
					binary,
					dataType,
					parent: self,
				}
			})
		}}>
			<i data-feather="external-link" class="icon-link"></i>
			<div style="user-select: none">
				{label ?? name}
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.link {
		margin: 1rem auto;
		max-width: 56rem;
		height: 20px;
		
		.icon-link {
			float: left;
			margin-top: -2px;
			margin-right: 6px;
		}
	}
</style>
