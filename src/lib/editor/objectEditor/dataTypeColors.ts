import { DataType } from "paper-mario-elfs/elfBinary";

export const defaultDataTypeColor = "#FFFFFF"

export const dataTypeColors = {
	[DataType.NpcSubState]: "#BEDA82",
	[DataType.NpcFace]: '#83caf4',
	[DataType.BtlAttackRange]: '#f7a3ae',
	// set battle only triggers when the title starts with "Stage Definition",
	// which is hard coded in Object Editor
	[DataType.SetBattle]: '#fdd5bd',
}

export const defaultObjectEditorHighlight = '#eaeaea'

export const objectEditorHighlights = {
	[DataType.NpcSubState]: '#aac472',
	[DataType.NpcFace]: '#6fb9e6',
	[DataType.BtlAttackRange]: '#df8995',
	[DataType.SetBattle]: '#f5bd94',
}
