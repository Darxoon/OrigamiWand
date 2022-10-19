<script lang="ts">
	import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import { toReadableString } from "$lib/util";
	import { createEventDispatcher, onMount } from "svelte";
	
	import { dataTypeColors, defaultDataTypeColor, defaultObjectEditorHighlight, objectEditorHighlights } from "./dataTypeColors";
	import CrossObjectLink from "./CrossObjectLink.svelte";
	import InputField from "./InputField.svelte"
	import { hexFields } from "./viewAsHex";
	import ButtonStrip from './ButtonStrip.svelte';
	import FieldIcons from './FieldIcons.svelte';
	
	const dispatch = createEventDispatcher()

	export let title: string
	export let obj: object
	export let dataType: DataType | undefined = undefined
	export let showButtons = true
	export let binary: ElfBinary = undefined
	
	export let backgroundColor: string = dataTypeColors[dataType] ?? defaultDataTypeColor
	export let labelHighlightColor: string = objectEditorHighlights[dataType] ?? defaultObjectEditorHighlight
	
	export let open = false
	
	export let highlightedFields: Set<string> = new Set()
	
	$: entries = Object.entries(obj)
	
	let initialized = false
	
	let mouseY = 0
	let mouseInside = false
	let entryLabelElements: HTMLDivElement[] = []
	
	export function scrollIntoView() {
		editor.scrollIntoView({
			behavior: 'smooth',
		})
	}
	
	function updateEntries(e) {
		dispatch('valueChanged')
		
		const { key, value } = e.detail
		obj[key] = value
	}
	
	onMount(() => {
		function viewportCheck() {
			if (!hasEnteredViewport && editor?.getBoundingClientRect().y < window.innerHeight) {
				hasEnteredViewport = true
				dispatch('appear')
			}
		}
		
		window.addEventListener('scroll', e => {
			viewportCheck()
		})
		
		viewportCheck()
	})
	
	function areIconsShown(i: number, mouseY: number) {
		return mouseInside
			&& mouseY >= entryLabelElements[i]?.getBoundingClientRect()?.y
			&& (mouseY < (entryLabelElements[i + 1] ? entryLabelElements[i + 1] : Array.from(entryLabelElements).slice(i + 2).find(x => x))
				?.getBoundingClientRect()?.y || entryLabelElements.length - 1 <= i);
	}
	
	let hasEnteredViewport = false
	
	let childrenOpen = false
	
	let editor: HTMLDivElement
	
	$: childDataType = dataType ? FILE_TYPES[dataType].childTypes[FILE_TYPES[dataType].childField] : undefined
</script>

<svelte:options accessors={true} />

<div class="card editor" style="--bg-card: {backgroundColor}; --bg-label-highlight: {labelHighlightColor}" bind:this={editor} 
		on:mousemove={e => mouseY = e.clientY} on:mouseenter={e => mouseInside = true} on:mouseleave={e => mouseInside = false}>
	
	<div class="title" class:rotated={open} on:click={() => {open = !open; initialized = true}}>
		<i data-feather="chevron-down" class="icon-arrow"></i><span class="titleLabel">{title}</span>
		
		{#if showButtons}
			<ButtonStrip on:duplicate on:delete></ButtonStrip>
		{/if}
	</div>
	
	{#if initialized || open}
		<div class="content" class:invisible={!open}>
			{#each entries as [field, value], i}
			{#if !(FILE_TYPES[dataType].metadata[field]?.hidden ?? false)}
				
				<!-- Field Label -->
				<div class="key" class:highlighted={highlightedFields?.has(field)} 
				class:bold={!field.startsWith('field_')} bind:this={entryLabelElements[i]} 
				class:italic={field.startsWith('field_') && FILE_TYPES[dataType].metadata[field]?.description}>
					{toReadableString(field)}
					
					<FieldIcons fieldName={field} dataType={dataType} shown={areIconsShown(i, mouseY)} />
				</div>
				
				<!-- Value Input -->
				<div class="value">
					{#if (FILE_TYPES[dataType].typedef[field] === "pointer" || FILE_TYPES[dataType].typedef[field] === "symbol") && value != null}
						<CrossObjectLink label={`Click to open (${value.length} item${value.length > 1 ? 's' : ''})`} binary={binary}
							tabTitle={FILE_TYPES[dataType].metadata[field]?.tabName} objectId={obj[FILE_TYPES[dataType].identifyingField]}
								sourceDataType={dataType} targetDataType={FILE_TYPES[dataType].childTypes[field]} targetObjects={value} on:open />
					{:else}
						<InputField on:valueChanged={updateEntries} noSpaces={FILE_TYPES[dataType].metadata[field]?.noSpaces ?? false}
							fieldType={FILE_TYPES[dataType].typedef[field]} key={field} value={value}
							viewAsHex={$hexFields[dataType] && $hexFields[dataType][field]} />
					{/if}
				</div>
				
			{/if}
			{/each}
		</div>
	{/if}	
	
	{#if FILE_TYPES[dataType].childField}
		<div class="child_container" class:invisible={!open}>
			<div class="showChildren" on:click={e => childrenOpen = !childrenOpen}>
				<div class:rotated={childrenOpen}>
					<i data-feather="chevron-down" class="icon-children-arrow"></i>
				</div>
				<span>{toReadableString(FILE_TYPES[dataType].childFieldLabel ?? FILE_TYPES[dataType].childField)}</span>
			</div>
			{#if childrenOpen}
				<div class="children">
					{#each obj[FILE_TYPES[dataType].childField] as child, i}
						<svelte:self title={`${FILE_TYPES[childDataType].displayName} ${i}`
							+ (child[FILE_TYPES[dataType].identifyingField] ? `: ${child[FILE_TYPES[dataType].identifyingField]}` : "")}
							dataType={childDataType} obj={child} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	:root {
		--bg-label-highlight: #eaeaea;
	}
	
	.editor {
		margin: 1rem auto;
		max-width: 56rem;
	}
	
	.title {
		position: relative;
		user-select: none;
		height: 20px;
		
		.icon-arrow {
			float: left;
			
			margin-top: -1px;
			margin-right: 1px;
		}
		
		&.rotated .icon-arrow {
			transform: rotate(180deg);
		}
		
		.titleLabel {
			transform: translateY(-1px);
			display: inline-block;
		}
	}
	
	.content {
		margin-top: 8px;
		display: grid;
		grid-template-columns: minmax(min-content, 24%) auto;
		
		.key {
			position: relative;
			height: min-content;
			padding: 3px 3rem 3px 2px;
			margin-right: 2px;
			
			&.bold { font-weight: bold }
			&.italic { font-style: italic }
			&.highlighted { background: #fff11c; border-radius: 3px }
		}
		
		.value {
			margin-bottom: 6px;
		}
		
		:nth-child(4n-1) {
			background: var(--bg-label-highlight);
			border-radius: 3px;
		}
	}
	
	.child_container {
		margin-top: 0.3em;
		
		.showChildren {
			display: flex;
			
			font-size: 20px;
			cursor: pointer;
			user-select: none;
			
			div {
				width: 29px;
				height: 29px;
			}
			
			.rotated {
				transform: rotate(180deg);
			}
			
			.icon-children-arrow {
				width: 29px;
				height: 29px;
				stroke-width: 1.8px;
			}
		}
	}
	
	.invisible {
		display: none;
	}
</style>
