<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import ElfEditor from '$lib/editor/fileEditor/ElfEditor.svelte';
	import SpecialElfEditor from '$lib/editor/fileEditor/SpecialElfEditor.svelte';
	import { DataType, ElfBinary } from 'paper-mario-elfs/elfBinary';
	import { FILE_TYPES } from 'paper-mario-elfs/fileTypes';
	import parseElfBinary, { EmptyFileError } from 'paper-mario-elfs/parser';
	import serializeElfBinary from 'paper-mario-elfs/serializer';
	import DataTypePrompt from '$lib/modals/DataTypePrompt.svelte';
	import DescriptionViewer from '$lib/modals/DescriptionViewer.svelte';
	import { currentModal, modalVisible, showModal } from '$lib/modal/modal';
	import Modal from '$lib/modal/Modal.svelte';
	import TextAlert from '$lib/modal/TextAlert.svelte';
	import { createTemporarySave, getLatestSave, init, type SaveFile } from '$lib/save/autosave';
	import TitleCard from '$lib/TitleCard.svelte';
	import { compress, decompress, downloadBlob, loadFile, map2d } from '$lib/util';
	import { onMount } from 'svelte/internal';
	import type { Tab } from '$lib/editor/globalDragging';
	import NoteViewer from '$lib/modals/NoteViewer.svelte';
	import { loadedAutosave } from '$lib/stores';
	
	import EditorStrip from '$lib/editor/EditorStrip.svelte';
	import { getZstdMenu } from '$lib/zstdMenu';
	import { getHelpMenu } from '$lib/helpMenu';
	
	let tabs: Tab[][] = [[]]
	let selectedTabs = []
	let activeEditor = 0
	let editorStrip: EditorStrip
	
	export const menuItems = [
		{
			title: "File",
			items: [
				{
					name: "Close session",
					onClick() {
						let result = confirm("Do you want to close all tabs?")
						
						if (result) {
							$loadedAutosave = true
							tabs = [[]]
						}
					}
				},
				{
					name: "Open...",
					onClick: openFileSelector
				},
				{
					name: "Save...",
					onClick: saveFile
				},
			],
		},
		{
			title: "Edit",
			items: [
				{
					name: "Edit Type Definition...",
					onClick: () => {
						showModal(TextAlert, {
							title: "Coming Soon",
							content: "The feature to edit the type definition is not completed, and thus is not available yet."
						})
					}
				}
			],
		},
		getZstdMenu(),
		{
			title: "View",
			items: [
				{
					name: "Collapse all",
					onClick: () => editorStrip.collapseAll(),
				},
				{
					name: "Expand all",
					onClick: () => editorStrip.expandAll(),
				},
				{
					name: "View all User Notes...",
					onClick: () => {
						showModal(NoteViewer, {})
					}
				},
				{
					name: "View all Descriptions...",
					onClick: () => {
						viewAllDescriptions()
					}
				},
			],
		},
		getHelpMenu(),
	]
	
	function openFileSelector() {
		console.log("opening file")

		const fileSelector = document.createElement('input')
		fileSelector.setAttribute('type', 'file')
		fileSelector.click()
		
		fileSelector.addEventListener('change', async (e: any) => {
			const file: File = e.target.files[0]
			
			const contentPromise = loadFile(file)
			
			const {dataType, isCompressed} = await showModal(DataTypePrompt, {
				fileName: file.name,
			})

			if (!dataType) {
				return
			}
			
			const content = isCompressed ? await decompress(await contentPromise) : await contentPromise
			
			let binary 
			try {
				binary = parseElfBinary(dataType, content)
			} catch (e) {
				if (e instanceof EmptyFileError) {
					showModal(TextAlert, {
						title: "Opening File",
						content: "File is empty. Generating a new file instead."
					})
						.then(() => {
							showModal(TextAlert, {
								title: "Error",
								content: "Error: Not implemented yet."
							})
						})
				}
				
				throw e
			}

			tabs[0] = [
				...tabs[0], 
				Tab(file.name, binary, dataType, isCompressed),
			]
		})
	}

	function Tab(fileName: string, binary: ElfBinary, dataType: DataType, isCompressed: boolean): Tab {
		if (dataType === DataType.DataBtlSet || dataType === DataType.DataConfettiTotalHoleInfo || dataType === DataType.DataUi) {
			return {
				id: Symbol(),
				name: fileName,
				shortName: fileName,
				component: SpecialElfEditor,
				children: [],
				isCompressed,
				properties: {
					dataType,
					binary,
					fileName,
				},
			}
		} else {
			return {
				id: Symbol(),
				name: fileName,
				shortName: fileName,
				component: ElfEditor,
				children: [],
				isCompressed,
				properties: {
					objectTitle: FILE_TYPES[dataType].displayName,
					binary,
					objects: dataType === DataType.Maplink
						? binary.data.get(ElfBinary.ObjectType.MaplinkNodes)
						: binary.data.get(ElfBinary.ObjectType.Main),
					headerObject: dataType === DataType.Maplink ? binary.data.get(ElfBinary.ObjectType.Main)[0] : undefined,
					importantFieldName: FILE_TYPES[dataType].identifyingField,
					dataType,
				},
			}
		}
		
		selectedTabs[0] = tabs[0].length - 1
	}
	
	async function saveFile() {
		let tab = tabs[activeEditor][selectedTabs[activeEditor]]
		
		if (tab.parentId) {
			showModal(TextAlert, {
				title: "Cannot Save",
				content: "Try saving the parent file instead."
			})
			return
		}

		const { name, isCompressed, properties: { dataType, binary } } = tab
		
		let serialized = serializeElfBinary(dataType, binary)
		let output = isCompressed ? await compress(serialized) : serialized
		
		downloadBlob(output, name)
	}

	function viewAllDescriptions() {
		let	tab = tabs[activeEditor][selectedTabs[activeEditor]]
		let dataType = tab.properties.dataType
		
		if (Object.entries(FILE_TYPES[dataType].metadata).length > 0) {
			showModal(DescriptionViewer, {
				typeMetadata: FILE_TYPES[dataType].metadata,
			})
		} else {
			showModal(TextAlert, {
				title: "No Descriptions",
				content: "This file format contains no field descriptions.",
			})
		}
	}
	
	
	async function autoSaveWindows() {
		const serializedWindows = tabs.map(currentTabs => {
			const serializedTabs = currentTabs.flatMap<SaveFile>(tab => {
				const { dataType, binary } = tab.properties
				
				return tab.parentId ? [] : {
					name: tab.name,
					dataType,
					isCompressed: tab.isCompressed,
					content: serializeElfBinary(dataType, binary),
				}
			})
			return serializedTabs
		})
		
		console.log('serializedWindows', serializedWindows)
		
		await createTemporarySave(serializedWindows)
	}
	
	onMount(() => {
		init()
			.then(async () => {
				let save = await getLatestSave()
				
				console.log('loading save', save)
				
				if (!save) {
					$loadedAutosave = true
					return
				}
				
				tabs = map2d(save, ({name, dataType, content, isCompressed}) => 
					Tab(name, parseElfBinary(dataType, content), dataType, isCompressed)
				).filter(arr => arr.length > 0)
				
				if (tabs.length == 0)
					tabs = [[]]
				
				afterUpdateHandlers = [...afterUpdateHandlers, () => {
					$loadedAutosave = true
				}]
			})

		window.addEventListener('beforeunload', async e => {
			await autoSaveWindows()
		})

		window.addEventListener('keydown', e => {
			if (e.ctrlKey) {
				switch (e.key) {
					// doesn't work because file input gets blocked
					//case "o":
					//	e.preventDefault()
					//	openFileSelector()
					//	break
					case "s":
						e.preventDefault()
						saveFile()
						break
				}
			}
		})
		
		let betaBannerShown = !!localStorage.beta
		
		if (!betaBannerShown) {
			showModal(TextAlert, {
				title: "Origami Wand Beta",
				fontSize: 14,
				content: `
Welcome to the Origami Wand Beta!

This product is still in beta, so it is not finished yet and might still contain bugs.
If you encounter any, **please report them using the "Report bugs" button** or reach out
to me, the developer (Darxoon). Thanks.`
			})
			
			localStorage.beta = 1
		}
	})
	
	let afterUpdateHandlers: Function[] = []
	
	let draggingFile = false
	
	function fileDragHandler(e: DragEvent) {
		if (e.dataTransfer.types.includes("Files")) {
			draggingFile = true
			e.preventDefault()
		}
	}
	
	async function fileDropHandler(e: DragEvent) {
		if (e.dataTransfer.types.includes("Files")) {
			draggingFile = false
			
			e.preventDefault()
			
			if (e.dataTransfer.items) {
				// Use DataTransferItemList interface to access the file(s)
				for (var i = 0; i < e.dataTransfer.items.length; i++) {
					// If dropped items aren't files, reject them
					if (e.dataTransfer.items[i].kind === 'file') {
						var file = e.dataTransfer.items[i].getAsFile();
						console.log('... file[' + i + '].name = ' + file.name);
						await loadFile(file)
					}
				}
			} else {
				// Use DataTransfer interface to access the file(s)
				for (var i = 0; i < e.dataTransfer.files.length; i++) {
					console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
				}
			}
		}
	}
	
	function dragLeaveHandler(e: DragEvent) {
		draggingFile = false
	}
</script>

<svelte:head>
	<title>Origami Wand</title>
	
	<meta property="og:url" content="https://darxoon.github.io/OrigamiWand/">
	<meta property="og:type" content="website">
	<meta property="og:title" content="Origami Wand">
	<meta property="og:description" content="Editor for Paper Mario: The Origami King (Beta)">
	<meta property="og:image" content="https://darxoon.github.io/res/origamiwand.png">

	<meta name="twitter:card" content="summary_large_image">
	<meta property="twitter:domain" content="darxoon.github.io">
	<meta property="twitter:url" content="https://darxoon.github.io/OrigamiWand/">
	<meta name="twitter:title" content="Origami Wand">
	<meta name="twitter:description" content="Editor for Paper Mario: The Origami King (Beta)">
	<meta name="twitter:image" content="https://darxoon.github.io/res/origamiwand.png">
</svelte:head>

<section class="main" class:noOverflow={$modalVisible} on:dragover={fileDragHandler} on:dragleave={dragLeaveHandler} on:drop={fileDropHandler}>
	<div class="title_card">
		<TitleCard menu={menuItems} />
	</div>
	
	<EditorStrip bind:this={editorStrip} bind:tabs={tabs} bind:activeEditor={activeEditor} bind:selectedTabs={selectedTabs}></EditorStrip>
</section>

{#if $modalVisible}
	<Modal>
		<svelte:component this={$currentModal.constructor} {...$currentModal.properties} />
	</Modal>
{/if}

<div class="dragOverlay" class:shown={draggingFile}>
	<div class="dragWrapper">
		<div class="card dragContent">
			Drop file to open
		</div>
	</div>
</div>

<style lang="scss">
	.main {
		height: 2px;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.title_card {
		padding: 1.5rem;
	}
	
	.noOverflow {
		overflow-y: hidden;
	}
	
	.dragOverlay {
		pointer-events: none;
		
		position: fixed;
		max-height: 100vh;
		display: flex;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		
		background: none;
		
		transition: background 0.4s;
		
		&.shown {
			background: #00000038;
			
			.dragWrapper {
				visibility: visible;
			}
		}
	}
	
	.dragWrapper {
		--margin: 2rem;
		
		pointer-events: none;
		
		visibility: hidden;
		display: flex;
		position: absolute;
		top: var(--margin);
		left: var(--margin);
		bottom: var(--margin);
		right: var(--margin);
	}
	
	.dragContent {
		pointer-events: none;
		
		margin: 10% auto auto auto;
		min-width: 12rem;
		background: #e4e4e4;
		font-weight: bold;
		font-size: 14pt;
		text-align: center;
	}
</style>
