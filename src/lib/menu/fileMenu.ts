import type EditorStrip from "$lib/editor/EditorStrip.svelte"
import { showModal } from "$lib/modal/modal"
import TextAlert from "$lib/modal/TextAlert.svelte"
import DataTypePrompt from "$lib/modals/DataTypePrompt.svelte"
import SaveAsDialog from "$lib/modals/SaveAsDialog.svelte"
import { globalEditorStrip, loadedAutosave } from "$lib/stores"
import { compress, decompress, downloadBlob, getFileContent, createFileTab } from "$lib/util"
import type { ElfBinary } from "paper-mario-elfs/elfBinary"
import { DataType } from "paper-mario-elfs/dataType"
import parseElfBinary, { EmptyFileError } from "paper-mario-elfs/parser"
import serializeElfBinary from "paper-mario-elfs/serializer"
import stripBinary from "paper-mario-elfs/strip"

let editorStrip: EditorStrip
globalEditorStrip.subscribe(value => editorStrip = value)

export function getFileMenu() {
	return {
		title: "File",
		items: [
			{
				name: "Close session",
				onClick() {
					let result = confirm("Do you want to close all tabs?")
					
					if (result) {
						loadedAutosave.set(true)
						editorStrip.reset()
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
			{
				name: "Save As...",
				onClick: openSaveDialog,
			}
		],
	}
}

export async function openFileToEditor(file: File) {
	const contentPromise = getFileContent(file)
	
	const {dataType, isCompressed} = await showModal(DataTypePrompt, {
		fileName: file.name,
	})

	if (!dataType) {
		return
	}
	
	console.log(DataType[dataType])
	
	const content = isCompressed ? await decompress(await contentPromise) : await contentPromise
	
	let binary: ElfBinary
	
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

	editorStrip.appendTab(createFileTab(file.name, binary, dataType, isCompressed))
}

function openFileSelector() {
	console.log("opening file")

	const fileSelector = document.createElement('input')
	fileSelector.setAttribute('type', 'file')
	fileSelector.click()
	
	fileSelector.addEventListener('change', async (e: any) => {
		const file: File = e.target.files[0]
		
		await openFileToEditor(file)
	})
}

async function saveFile() {
	let tab = editorStrip.activeTab()
	
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

export interface SaveAsDialogResults {
	fileName: string
	compressFile: boolean
	compressionRatio?: number
	stripFile: boolean
}

async function openSaveDialog() {
	let tab = editorStrip.activeTab()
	
	if (tab.parentId) {
		showModal(TextAlert, {
			title: "Cannot Save",
			content: "Try saving the parent file instead."
		})
		return
	}
	
	const { dataType, binary } = tab.properties
	
	const modalOptions = {
		fileName: tab.name,
		compressFile: tab.isCompressed,
	}
	
	let { fileName, compressFile, compressionRatio, stripFile } = await showModal<SaveAsDialogResults>(SaveAsDialog, modalOptions)
	
	fileName = fileName.trim()
	
	if (compressFile && !fileName.endsWith('.zst')) {
		fileName += '.zst'
	}
	
	if (!compressFile && fileName.endsWith('.zst')) {
		fileName = fileName.slice(0, fileName.length - 4)
	}
	
	if (stripFile) {
		stripBinary(binary, { comment: "Made with Origami Wand by Darxoon" })
	}
	
	let serialized = serializeElfBinary(dataType, binary)
	
	try {
		let output = compressFile ? await compress(serialized, compressionRatio) : serialized
		
		downloadBlob(output, fileName)
	} catch (e) {
		if (typeof e == "string" && e.includes("OOM")) {
			showModal(TextAlert, {
				title: "Zstd Error",
				content: "Not enough memory available for Compression. Try lowering the compression ratio.",
			})
		}
	}
}
