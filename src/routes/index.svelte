<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import EditorWindow from '$lib/editor/EditorWindow.svelte';
	import ElfEditor from '$lib/editor/ElfEditor.svelte';
	import SpecialElfEditor from '$lib/editor/SpecialElfEditor.svelte';
	import { DataType, ElfBinary } from '$lib/elf/elfBinary';
	import { FILE_TYPES } from '$lib/elf/fileTypes';
	import parseElfBinary from '$lib/elf/parser';
	import serializeElfBinary from '$lib/elf/serializer';
	import DataTypePrompt from '$lib/modal/DataTypePrompt.svelte';
	import DescriptionViewer from '$lib/modal/DescriptionViewer.svelte';
	import { currentModal, modalVisible, showModal } from '$lib/modal/modal';
	import Modal from '$lib/modal/Modal.svelte';
	import TextAlert from '$lib/modal/TextAlert.svelte';
	import { createTemporarySave, getLatestSave, init } from '$lib/autosave';
	import TitleCard from '$lib/TitleCard.svelte';
	import { downloadBlob, map2d } from '$lib/util';
	import { afterUpdate } from 'svelte';
	import { onMount } from 'svelte/internal';
	import type { Tab } from '$lib/editor/globalDragging';
	import NoteViewer from '$lib/modal/NoteViewer.svelte';
	
	let tabs: Tab[][] = [[]]
	let selectedTabs = []
	let activeEditor = 0
	
	export const menuItems = [
		{
			title: "File",
			items: [
				{
					name: "Close session",
					onClick: () => {
						let result = confirm("Do you want to close all tabs?")
						
						if (result) {
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
		{
			title: "Zstd",
			items: [
				{
					name: "Coming soon...",
					onClick: () => {},
				},
			],
		},
		{
			title: "View",
			items: [
				{
					name: "Collapse all",
					onClick: () => {
						collapseAll()
					},
				},
				{
					name: "Expand all",
					onClick: () => {
						expandAll()
					},
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
		{
			title: "Help",
			items: [
				{
					name: "Open website",
					onClick: () => {
						let link = document.createElement('a')
						link.target = "_blank"
						link.rel = "noopener noreferrer"
						link.href = "https://github.com/darxoon/origamiwand"
						link.click()
					}
				},
				{
					name: "About",
					onClick: () => {
						showModal(TextAlert, {
							title: "About Origami Wand",
							content: `
	Made by Darxoon

	Additional help by [HunterXuman](https://twitter.com/HunterXuman/)

	GitHub: [](https://github.com/darxoon/origamiwand)`
						})
					},
				},
			],
		},
	]

	function openFileSelector() {
		console.log("opening file")

		const fileSelector = document.createElement('input')
		fileSelector.setAttribute('type', 'file')
		fileSelector.click()
		
		fileSelector.addEventListener('change', async (e: any) => {
			const file: File = e.target.files[0]
			
			const [content, dataType] = await Promise.all([
				loadFile(file),
				showModal<false | DataType>(DataTypePrompt, {
					fileName: file.name,
				})
			])

			if (!dataType) {
				return
			}

			const binary = parseElfBinary(dataType, content)

			tabs[0] = [
				...tabs[0], 
				Tab(file.name, binary, dataType),
			]
		})
	}

	function Tab(fileName: string, binary: ElfBinary, dataType: DataType): Tab {
		if (dataType === DataType.DataBtlSet || dataType === DataType.DataConfettiTotalHoleInfo) {
			return {
				id: Symbol(),
				name: fileName,
				shortName: fileName,
				component: SpecialElfEditor,
				children: [],
				properties: {
					dataType,
					binary,
				},
			}
		} else {
			return {
				id: Symbol(),
				name: fileName,
				shortName: fileName,
				component: ElfEditor,
				children: [],
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
	
	function loadFile(file: File) {
		return new Promise<ArrayBuffer>((resolve, reject) => {
			const fileReader = new FileReader()
			
			fileReader.onload = function(e) {
				console.log(fileReader.result)
				
				resolve(fileReader.result as ArrayBuffer)
			}

			fileReader.onerror = function(e) {
				reject(e)
			}
			
			fileReader.readAsArrayBuffer(file)
		})
	}
	
	function saveFile() {
		let tab = tabs[activeEditor][selectedTabs[activeEditor]]
		
		if (tab.parentId) {
			showModal(TextAlert, {
				title: "Cannot Save",
				content: "Try saving the parent file instead."
			})
			return
		}
		
		let output = serializeElfBinary(tab.properties.dataType, tab.properties.binary)
		
		downloadBlob(output, tab.name)
	}
	
	let editorWindows: EditorWindow[] = []

	function collapseAll() {
		editorWindows[activeEditor].collapseAll()
	}

	function expandAll() {
		editorWindows[activeEditor].expandAll()
	}

	function viewAllDescriptions() {
		let	 tab = tabs[activeEditor][selectedTabs[activeEditor]]
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
			const serializedTabs = currentTabs.flatMap(tab => {
				const { dataType, binary } = tab.properties
				
				return tab.parentId ? [] : {
					name: tab.name,
					dataType,
					content: serializeElfBinary(dataType, binary),
				}
			})
			return serializedTabs
		})
		
		console.log('serializedWindows', serializedWindows)
		
		await createTemporarySave(serializedWindows)
	}
	
	
	let isWide = false
	
	onMount(() => {
		init()
			.then(async () => {
				let save = await getLatestSave()
				
				if (save) {
					tabs = map2d(save, ({name, dataType, content}) => {
						let binary = parseElfBinary(dataType, content)
						
						return Tab(name, binary, dataType)
					})
					
					tabs = tabs.filter(arr => arr.length > 0)
				}
			})
		
		let mediaQuery = window.matchMedia("(min-width: 1000px)")
		mediaQuery.addEventListener('change', e => {
			isWide = e.matches
		})
		
		isWide = mediaQuery.matches

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
	
	let tabToAdd: Tab
	let tabToAddEditorIndex = 0
	
	afterUpdate(() => {
		if (tabToAdd) {
			editorWindows[tabToAddEditorIndex].addTab(tabToAdd)
			activeEditor = tabToAddEditorIndex
			tabToAdd = null
		}
	})
	
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
</svelte:head>

<section class="main" on:dragover={fileDragHandler} on:dragleave={dragLeaveHandler} on:drop={fileDropHandler}>
	<div class="title_card">
		<TitleCard menu={menuItems} />
	</div>
	
	<div class="editors">
		{#each tabs as tabList, i}
			<div on:mousedown|capture={e => activeEditor = i}>
				<EditorWindow isActive={activeEditor == i} showBugReporter={i == 0}
					bind:this={editorWindows[i]} bind:selectedIndex={selectedTabs[i]} bind:tabs={tabList} 
					on:removeEditor={e => {
						if (tabs.length > 1) {
							editorWindows[i].setActive()
							let newTabs = [...tabs]
							newTabs.splice(i, 1)
							tabs = newTabs
						} else {
							editorWindows[0].setActive()
						}
					}}
					on:delete={e => {
						let index = e.detail.index
						if (typeof index === 'undefined') {
							tabList[selectedTabs[i]].properties.objects.length = 0
							tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
						} else {
							tabList[selectedTabs[i]].properties.objects.splice(e.detail.index, 1)
							tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
						}
					}}
					on:addObject={e => {
						let obj = e.detail.obj
						if (typeof e.detail.index !== "undefined") {
							// we have to mutate the original array here, because that is directly linked with the ElfBinary
							tabList[selectedTabs[i]].properties.objects.splice(e.detail.index, 0, obj)
							tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
						} else {
							tabList[selectedTabs[i]].properties.objects.push(obj)
							tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
						}
					}}
					on:dockTab={e => {
						let { tab, isRight } = e.detail
						tabs.splice(isRight ? i + 1 : i, 0, [tab])
						tabs = tabs
					}}
					on:open={e => {
						if (e.detail.type === "window") {
							const { title, shortTitle, component, properties } = e.detail
							
							const childID = Symbol(`Tab ID ${title}`)
							
							tabList[selectedTabs[i]].children.push(childID)
							
							const parentId = tabList[selectedTabs[i]].id
							
							if (isWide) {
								if (tabs.length < 2) {
									tabs = [...tabs, []]
								}
								
								tabToAddEditorIndex = 1
								tabToAdd = {
									id: childID,
									parentId,
									name: title,
									shortName: shortTitle,
									component,
									properties,
									children: [],
								}
							} else {
								editorWindows[0].addTab({
									id: childID,
									parentId,
									name: title,
									shortName: shortTitle,
									component,
									properties,
									children: [],
								})
							}
						} else
							throw new Error(`Can't open ${JSON.stringify(e.detail.type)}, unknown type`)
					}}
					
					on:valueChanged={e => {
						console.log('valueChanged', e)
					}}
				/>
			</div>
		{/each}
	</div>
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
	
	.editors {
		flex: 1;
		
		display: flex;
		flex-direction: row;
		
		div {
			flex: 1;
		}
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
