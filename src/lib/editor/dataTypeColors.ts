import { Colors } from "$lib/color";
import { DataType } from "$lib/elf/elfBinary";

export const defaultDataTypeColor = Colors.WHITE

export const dataTypeColors = {
	[DataType.NpcSubState]: "#BEDA82",
	[DataType.NpcFace]: '#83caf4',
}

export const defaultObjectEditorHighlight = '#eaeaea'

export const objectEditorHighlights = {
	[DataType.NpcSubState]: '#aac472',
	[DataType.NpcFace]: '#6fb9e6',
}
