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
	import ObjectEditorTailExpander from './ObjectEditorTailExpander.svelte';
    import { showModal } from "$lib/modal/modal";
    import FieldOptionAlert from "$lib/modals/FieldOptionAlert.svelte";
	
	const dispatch = createEventDispatcher()

	export let title: string
	export let obj: object
	export let dataType: DataType | undefined = undefined
	export let showButtons = true
	export let binary: ElfBinary = undefined
	
	export let backgroundColor: string = dataTypeColors[dataType] ?? defaultDataTypeColor
	export let labelHighlightColor: string = objectEditorHighlights[dataType] ?? defaultObjectEditorHighlight
	
	export let open = false
	
	export let highlightedFields: string[] = []
	
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
		// @ts-ignore
		feather.replace()
		
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
	
	function showFieldMenu(dataType, fieldName) {
		const objects = binary.data[FILE_TYPES[dataType].objectType]
		
		showModal(FieldOptionAlert, {
			title: `Field '${toReadableString(fieldName)}'`,
			fieldName,
			
			dataType,
			binary,
			objects,
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
			console.error(new Error(`Argument is not an array, ${arrayOrObj}`))
			return NaN
		}
	}
	
	function onTitleClick() {
		open = !open;
		initialized = true;
	}
	
	function keyPress(e: KeyboardEvent) {
		if (e.key == "Enter" || e.key == " ") {
			e.preventDefault()
			e.stopPropagation()
			
			onTitleClick()
		}
	}
	
	let editor: HTMLDivElement
	
	let hasEnteredViewport = false
</script>

<svelte:options accessors={true} />

<div class="card editor" style="--bg-card: {backgroundColor}; --bg-label-highlight: {labelHighlightColor}" bind:this={editor} 
		on:mousemove={e => mouseY = e.clientY} on:mouseenter={e => mouseInside = true} on:mouseleave={e => mouseInside = false}>
	
	<div class="title" class:rotated={open}
		on:click={onTitleClick} on:keypress={keyPress} tabindex="0" role="button">
		
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
				<div class="key" class:highlighted={highlightedFields?.includes(field)} 
				class:bold={!field.startsWith('field_')} bind:this={entryLabelElements[i]} 
				class:italic={field.startsWith('field_') && FILE_TYPES[dataType].metadata[field]?.description}>
					{toReadableString(field)}
					
					<FieldIcons fieldName={field} dataType={dataType} shown={areIconsShown(i, mouseY)} 
						on:showMenu={e => showFieldMenu(dataType, field)} />
				</div>
				
				<!-- Value Input -->
				<div class="value">
					{#if (FILE_TYPES[dataType].typedef[field] === "pointer" || FILE_TYPES[dataType].typedef[field] === "symbol") && value != null}
						<CrossObjectLink label={`Click to open (${length(value)} item${length(value) < 2 ? '' : 's'})`} binary={binary}
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
		
		{#if FILE_TYPES[dataType].childField && typeof obj[FILE_TYPES[dataType].childField] === "object" && obj[FILE_TYPES[dataType].childField]}
			<ObjectEditorTailExpander dataType={dataType} visible={open} child={obj[FILE_TYPES[dataType].childField]} binary={binary} />
		{:else if FILE_TYPES[dataType].childField}
			<p class="child-content-null">Content could not be created because there are no other valid objects present</p>
		{/if}
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
	
	.child-content-null {
		margin-top: 0.3em;
		margin-bottom: 0;
		
		font-size: 20px;
	}
	
	.invisible {
		display: none;
	}
</style>
