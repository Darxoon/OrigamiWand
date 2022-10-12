import type EditorStrip from "$lib/editor/EditorStrip.svelte"
import { showModal } from "$lib/modal/modal"
import TextAlert from "$lib/modal/TextAlert.svelte"
import DescriptionViewer from "$lib/modals/DescriptionViewer.svelte"
import NoteViewer from "$lib/modals/NoteViewer.svelte"
import { globalEditorStrip } from "$lib/stores"
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