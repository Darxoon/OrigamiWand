import { dataDivisions, DataType } from "paper-mario-elfs/elfBinary";

export enum DataTypeExtension {
	HasComplexEditor,
	ComplexEditorCategory,
}

const hasComplexEditor = {
	[DataType.DataUi]: true,
	[DataType.DataBtl]: true,
}

const complexEditorCategories = {
	[DataType.DataUi]: {
		"Models": {
			dataType: DataType.UiModel,
		},
		"Messages": {
			dataType: DataType.UiMsg,
		},
		"Shops": {
			dataType: DataType.UiShop,
		},
		"Sea Map": {
			dataType: DataType.UiSeaMap,
		},
		"Menus": {
			dataType: DataType.UiMenu,
		},
		"Announcements": {
			dataType: DataType.UiAnnouncement,
		},
		"Announcement Excludes": {
			dataType: DataType.UiAnnouncementExclude,
		},
	},
	
	[DataType.DataBtl]: {
		"Actors": {
			label: "Actors (all characters in battle)",
			dataType: DataType.BtlUnit,
		},
		"Models": {
			dataType: DataType.BtlModel,
		},
		"Parts": {
			dataType: DataType.BtlPart,
		},
		"Attacks": {
			dataType: DataType.BtlAttack,
		},
		"Attack Ranges": {
			dataType: DataType.BtlAttackRangeHeader,
		},
		"Boss Attacks": {
			dataType: DataType.BtlBossAttack,
		},
		"Event Cameras": {
			dataType: DataType.BtlEventCamera,
		},
		"Puzzle Levels": {
			dataType: DataType.BtlPuzzleLevel,
		},
		"Cheer Terms": {
			dataType: DataType.BtlCheerTerms,
		},
		"Cheers": {
			dataType: DataType.BtlCheer,
		},
		"Resources": {
			dataType: DataType.BtlResourceField,
		},
		"Settings": {
			dataType: DataType.BtlConfig,
		},
	},
}

const extensions = {
	[DataTypeExtension.HasComplexEditor]: hasComplexEditor,
	[DataTypeExtension.ComplexEditorCategory]: complexEditorCategories,
}

// TODO: this is totally overengineered, just make a different function for every category
export function dataTypeExtensions(extension: DataTypeExtension.HasComplexEditor, dataType: DataType): boolean;
export function dataTypeExtensions(extension: DataTypeExtension.ComplexEditorCategory, dataType: DataType): {[name: string]: any};

export function dataTypeExtensions(extension: DataTypeExtension, dataType: DataType): any {
	return extensions[extension][dataType]
}
