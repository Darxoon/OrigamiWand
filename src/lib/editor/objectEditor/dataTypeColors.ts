import { DataType } from "paper-mario-elfs/dataType";

export const defaultDataTypeColor = "#FFFFFF"

export const dataTypeColors = {
	[DataType.ModelFaceGroup]: "#BEDA82",
	[DataType.ModelFace]: '#83caf4',
	[DataType.BtlAttackRange]: '#f7a3ae',
	// set battle only triggers when the title starts with "Stage Definition",
	// which is hard coded in Object Editor
	[DataType.SetBattle]: '#fdd5bd',
}

export const defaultObjectEditorHighlight = '#eaeaea'

export const objectEditorHighlights = {
	[DataType.ModelFaceGroup]: '#aac472',
	[DataType.ModelFace]: '#6fb9e6',
	[DataType.BtlAttackRange]: '#df8995',
	[DataType.SetBattle]: '#f5bd94',
}
