<script lang="ts">
	import { DataType, ElfBinary } from "$lib/elf/elfBinary";
	import { FILE_TYPES } from "$lib/elf/fileTypes";
	import { showFieldOptionEvent } from "$lib/events";
	import { showModal } from "$lib/modal/modal";
	import TextAlert from "$lib/modal/TextAlert.svelte";
	import { toReadableString } from "$lib/util";
	import { afterUpdate, createEventDispatcher, onMount } from "svelte";
	import CrossObjectLink from "./CrossObjectLink.svelte";
	import { dataTypeColors, defaultDataTypeColor, defaultObjectEditorHighlight, objectEditorHighlights } from "./dataTypeColors";

	import InputField from "./InputField.svelte"
	import { hexFields } from "./viewAsHex";
	
	const dispatch = createEventDispatcher()

	export let title: string
	export let obj: object
	export let dataType: DataType | undefined = undefined
	export let showButtons = true
	export let binary: ElfBinary = undefined
	
	export let backgroundColor: string = dataTypeColors[dataType] ?? defaultDataTypeColor
	export let labelHighlightColor: string = objectEditorHighlights[dataType] ?? defaultObjectEditorHighlight
	
	export let open = false
	
	$: entries = Object.entries(obj)
	
	// $: console.log("entries", {entries, obj, children: contentDiv?.children})
	
	let initialized = false
	
	let mouseY = 0
	let mouseInside = false
	let entryLabelElements: HTMLDivElement[] = []
	
	let spinnerShown = false
	
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
	
	let afterUpdateAction
	
	afterUpdate(() => {
		// spinnerShown = false
		switch (afterUpdateAction) {
			case "duplicate":
				dispatch('duplicate')
				break
			case "delete":
				dispatch('delete')
				break
		}
	})
	
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
	
	let hasEnteredViewport = false
	
	let childrenOpen = false
	
	let editor: HTMLDivElement
	
	$: childDataType = dataType ? FILE_TYPES[dataType].childTypes[FILE_TYPES[dataType].childField] : undefined
</script>

<svelte:options accessors={true} />

<div class="card editor" style="--bg-card: {backgroundColor}; --bg-label-highlight: {labelHighlightColor}" bind:this={editor} 
		on:mousemove={e => mouseY = e.clientY} on:mouseenter={e => mouseInside = true} on:mouseleave={e => mouseInside = false}>
	<div class="title" on:click={() => {open = !open; initialized = true}}>
		<img src={open ? "/OrigamiWand/static/up.svg" : "/OrigamiWand/static/down.svg"} alt="V" class="expander_icon"><span>{title}</span>
		
		{#if showButtons}
			<div class="buttons">
				<div class="spinner" class:hidden={!spinnerShown}><img src="/OrigamiWand/static/spinner.svg" alt="..."></div>
				<div class="duplicate" on:click|stopPropagation={() => {
					spinnerShown = true
					afterUpdateAction = "duplicate"
				}}><i class="fa fa-clone"></i></div>
				<div class="delete" on:click|stopPropagation={() => {
					spinnerShown = true
					afterUpdateAction = "delete"
				}}><img src="/OrigamiWand/static/x-button.svg" alt="x"></div>
			</div>
		{/if}
	</div>
	
	{#if initialized || open}
		<div class="content" class:invisible={!open}>
			{#each entries as [field, value], i}
				{#if !(FILE_TYPES[dataType].metadata[field]?.hidden ?? false)}
					<div class="key" class:bold={!field.startsWith('field_')} bind:this={entryLabelElements[i]} 
					class:italic={field.startsWith('field_') && FILE_TYPES[dataType].metadata[field]?.description}>
						{toReadableString(field)}
						<div class="fieldIcons" class:shown={mouseInside 
							&& mouseY >= entryLabelElements[i]?.getBoundingClientRect()?.y
							&& (mouseY < (entryLabelElements[i + 1] ? entryLabelElements[i + 1] : Array.from(entryLabelElements).slice(i + 2).find(x => x))
								?.getBoundingClientRect()?.y || entryLabelElements.length - 1 <= i)}>
							<div class="info_icon" class:hidden={FILE_TYPES[dataType].metadata[field]?.description === undefined}
								on:click={e => showModal(TextAlert, {
									title: `${toReadableString(field)}`,
									content: FILE_TYPES[dataType].metadata[field].description.trim(),
							})}>
								<i class="fa fa-info-circle"></i>
							</div>
							<div class="more_icon" on:click={e => {
								console.log("ObjectEditor.dataType", DataType[dataType])
								showFieldOptionEvent.emit('show', {
									fieldName: field,
									dataType,
								})
							}}>
								<i class="fa fa-ellipsis-h" aria-hidden="true"></i>
							</div>
						</div>
					</div>
					{#if FILE_TYPES[dataType].typedef[field] === "pointer"}
						<div class="value"><CrossObjectLink label={`Click to open (${value.length} item${value.length > 1 ? 's' : ''})`} binary={binary}
							tabTitle={FILE_TYPES[dataType].metadata[field]?.tabName} objectId={obj[FILE_TYPES[dataType].identifyingField]}
							sourceDataType={dataType} targetDataType={FILE_TYPES[dataType].childTypes[field]} targetObjects={value} on:open /></div>
					{:else}
						<div class="value"><InputField on:valueChanged={updateEntries} noSpaces={FILE_TYPES[dataType].metadata[field]?.noSpaces ?? false}
							fieldType={FILE_TYPES[dataType].typedef[field]} key={field} value={value} viewAsHex={$hexFields[dataType] && $hexFields[dataType][field]} /></div>
					{/if}
				{/if}
			{/each}
		</div>
	{/if}	
	
	{#if FILE_TYPES[dataType].childField}
		<div class="child_container" class:invisible={!open}>
			<div class="showChildren" on:click={e => childrenOpen = !childrenOpen}>
				<img src="/OrigamiWand/static/down.svg" alt="V" class:rotated={childrenOpen}>
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
	
	@keyframes rotating {
		from {
			transform: rotateZ(0deg);
		}
		to {
			transform: rotateZ(360deg);
		}
	}
	
	.child_container {
		margin-top: 0.3em;
		
		.showChildren {
			display: flex;
			
			font-size: 20px;
			cursor: pointer;
			user-select: none;
			
			img {
				width: 1em;
				height: 1em;
				
				padding: 0.2em;
				
				transition: transform 0.4s;
			}
			
			img.rotated {
				transform: rotate(180deg);
			}
		}
	}
	
	
	.editor {
		margin: 1rem auto;
		
		max-width: 56rem;
		
		.expander_icon {
			position: relative;
			
			user-select: none;
			pointer-events: none;
			
			height: 1rem;
			width: 1rem;
			
			margin-right: 4px;
			
			top: 2px;
		}
	}
	
	.title {
		position: relative;
		
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		
		.buttons {
			position: absolute;
			display: flex;
			
			top: 0;
			right: 0;
			
			margin-right: 6px;
			
			div {
				--size: 18px;
				
				height: var(--size);
				width: var(--size);
				margin-left: 2px;
			}
			
			img {
				margin-top: 2px;
			}
			
			.spinner img {
				animation: rotating 0.4s linear infinite;
			}
			
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
			
			&.bold {
				font-weight: bold;
			}
			
			&.italic {
				font-style: italic;
			}
		}
		
		.fieldIcons {
			display: flex;
			
			position: absolute;
			right: 0;
			top: 0;
			
			margin: -1px 2px 0 2px;
			visibility: hidden;
			
			&.shown {
				visibility: visible;
			}
			
			div {
				margin-left: 8px;
			}
		}
		
		.info_icon {
			font-size: 20px;
			color: #b6b8be;
			
			transition: color 0.1s;
			
			&:hover {
				color: #777a80;
			}
		}
		
		.more_icon {
			// position: absolute;
			// right: 0;
			// top: 0;
			font-size: 20px;
			color: #b6b8be;
			// margin: -1px 2px 0 2px;
			
			transition: color 0.1s;
			
			&:hover {
				color: #777a80;
			}
		}
		
		.value {
			margin-bottom: 6px;
		}
		
		:nth-child(4n-1) {
			background: var(--bg-label-highlight);
			border-radius: 3px;
		}
	}
	
	.invisible {
		display: none;
	}
	
	.hidden {
		visibility: hidden;
	}
</style>
