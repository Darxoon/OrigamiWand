import type EditorStrip from "$lib/editor/EditorStrip.svelte"
import { DataTypeExtension, dataTypeExtensions } from "$lib/editor/fileEditor/dataTypeExtensions"
import { showModal } from "$lib/modal/modal"
import TextAlert from "$lib/modal/TextAlert.svelte"
import DescriptionViewer from "$lib/modals/DescriptionViewer.svelte"
import NoteViewer from "$lib/modals/NoteViewer.svelte"
import { globalEditorStrip } from "$lib/stores"
import { DataType } from "paper-mario-elfs/elfBinary"
import { FILE_TYPES } from "paper-mario-elfs/fileTypes"

let editorStrip: EditorStrip
globalEditorStrip.subscribe(value => editorStrip = value)

export function getViewMenu() {
	return {
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
	}
}

function viewAllDescriptions() {
	let	tab = editorStrip.activeTab()
	let dataType = tab.properties.dataType
	
	// the map that every metadata will be stored in
	let allMetadata = new Map()
	
	// add metadata of current data type
	let mainMetadata = FILE_TYPES[dataType].metadata
	allMetadata.set(dataType, mainMetadata)
	
	// add metadata of child types if it's a group type like data_ui or data_btl
	if (dataTypeExtensions(DataTypeExtension.HasComplexEditor, dataType)) {
		let childTypes = dataTypeExtensions(DataTypeExtension.ComplexEditorCategory, dataType)
		
		for (const [name, { dataType }] of Object.entries(childTypes)) {
			allMetadata.set(dataType, FILE_TYPES[dataType].metadata)
		}
	}
	
	// maplink header
	if (dataType == DataType.Maplink) {
		allMetadata.set(DataType.MaplinkHeader, FILE_TYPES[DataType.MaplinkHeader].metadata)
	}
	
	// TODO: check if anything contains any more child types
	
	if (Object.entries(mainMetadata).length > 0 || allMetadata.size > 1) {
		showModal(DescriptionViewer, { allMetadata })
	} else {
		showModal(TextAlert, {
			title: "No Descriptions",
			content: "This file format contains no field descriptions.",
		})
	}
}