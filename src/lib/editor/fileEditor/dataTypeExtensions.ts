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
			dataDivision: dataDivisions.model,
		},
		"Messages": {
			dataType: DataType.UiMsg,
			dataDivision: dataDivisions.msg,
		},
		"Shops": {
			dataType: DataType.UiShop,
			dataDivision: dataDivisions.shop,
		},
		"Sea Map": {
			dataType: DataType.UiSeaMap,
			dataDivision: dataDivisions.seaEntry,
		},
		"Menus": {
			dataType: DataType.UiMenu,
			dataDivision: dataDivisions.menu,
		},
		"Announcements": {
			dataType: DataType.UiAnnouncement,
			dataDivision: dataDivisions.announcement,
		},
		"Announcement Excludes": {
			dataType: DataType.UiAnnouncementExclude,
			dataDivision: dataDivisions.announcementExclude,
		},
	},
	
	[DataType.DataBtl]: {
		"Models": {
			dataType: DataType.BtlModel,
			dataDivision: dataDivisions.model,
		},
		"Parts": {
			dataType: DataType.BtlPart,
			dataDivision: dataDivisions.part,
		},
		"Units": {
			dataType: DataType.BtlUnit,
			dataDivision: dataDivisions.unit,
		},
		"Attack Ranges": {
			dataType: DataType.BtlAttackRangeHeader,
			dataDivision: dataDivisions.attackRangeHeader,
		},
		"Attacks": {
			dataType: DataType.BtlAttack,
			dataDivision: dataDivisions.attack,
		},
		"Boss Attacks": {
			dataType: DataType.BtlBossAttack,
			dataDivision: dataDivisions.bossAttack,
		},
		"Event Cameras": {
			dataType: DataType.BtlEventCamera,
			dataDivision: dataDivisions.eventCamera,
		},
		"Puzzle Levels": {
			dataType: DataType.BtlPuzzleLevel,
			dataDivision: dataDivisions.puzzleLevel,
		},
		"Cheer Terms": {
			dataType: DataType.BtlCheerTerms,
			dataDivision: dataDivisions.cheerTerm,
		},
		"Cheers": {
			dataType: DataType.BtlCheer,
			dataDivision: dataDivisions.cheer,
		},
		"Resources": {
			dataType: DataType.BtlResourceField,
			dataDivision: dataDivisions.resourceField,
		},
		"Settings": {
			dataType: DataType.BtlConfig,
			dataDivision: dataDivisions.config,
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
