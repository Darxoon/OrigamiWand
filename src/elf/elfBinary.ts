import { demangle } from "./nameMangling"
import type { Section, Symbol } from "./types"

/**
 * An ELF file
 */
export class ElfBinary {
	private sections: Section[]
	data: {[division in DataDivision]?: any[]}
	symbolTable: Symbol[]
	modelSymbolReference: WeakMap<object[]|object, string>
	
	constructor(
		sections: Section[], 
		data: {[division in DataDivision]?: any[]}, 
		symbolTable: Symbol[], 
		modelSymbolReference: WeakMap<any | any[], string>,
	) {
		this.sections = sections
		this.data = data
		this.symbolTable = symbolTable
		this.modelSymbolReference = modelSymbolReference
	}
	
	public findSymbol(name: string): Symbol {
		return this.symbolTable.find(symbol => demangle(symbol.name) === name)
	}
	
	public findSymbolIndex(name: string): number {
		return this.symbolTable.findIndex(symbol => demangle(symbol.name) === name)
	}
}

export const dataDivisions = {
	main: "main",
	maplinkNodes: "maplinkNodes",

	assetGroup: "assetGroup",
	state: "state",
	subState: "subState",
	face: "face",
	anime: "anime",

	element: "element",
	map: "map",

	dataHeader: "dataHeader",
	hole: "hole",
	version: "version",

	category: "category",

	model: "model",
	modelProperty: "modelProperty",
	msg: "msg",
	shop: "shop",
	sellItem: "sellItem",
	seaEntry: "seaEntry",
	menu: "menu",
	announcement: "announcement",
	announcementExclude: "announcementExclude",
	
	part: "part",
	unit: "unit",
	attackRangeHeader: "attackRangeHeader",
	attackRange: "attackRange",
	attack: "attack",
	eventCamera: "eventCamera",
	bossAttack: "bossAttack",
	puzzleLevel: "puzzleLevel",
	cheerTerm: "cheerTerm",
	cheer: "cheer",
	resourceField: "resourceField",
	resource: "resource",
	config: "config",
} as const

export type DataDivision = keyof typeof dataDivisions

export enum DataType {
	None,
	
	// dispos
	Npc,
	Item,
	Mobj,
	Aobj,
	BShape,
	Maplink,
	Hand,
	Hariko,
	Hole,
	Effect,
	Sobj,
	Gobj,
	
	Lobj,
	DigPoint,
	
	ResourceGobj,
	
	// data
	DataNpc,
	DataItem,
	DataMap,
	DataHariko,
	DataMobj,
	DataAobj,
	
	// data_model.elf
	DataNpcModel,
	DataItemModel,
	DataGobjModel,
	DataHarikoModel,
	DataNaviModel,
	DataMobjModel,
	DataPlayerModel,
	DataModelEnd,
	
	DataItemSet,
	
	// misc data.elf types
	// DataMuseum,
	DataBtlSet,
	DataConfettiTotalHoleInfo,
	DataEffect,
	DataMaplinkZoom,
	DataParty,
	DataUi,
	DataBtl,
	
	// this is the end of the actual file types
	TypeAmount,
	
	MaplinkHeader,
	
	NpcFiles,
	NpcState,
	NpcSubState,
	NpcFace,
	NpcAnime,
	
	BtlSetCategory,
	BtlSetElement,
	Metadata,
	
	ConfettiVersion,
	ConfettiData,
	ConfettiMap,
	ConfettiHole,
	
	UiModel,
	UiModelProperty,
	UiMsg,
	UiShop,
	UiSellItem,
	UiSeaMap,
	UiMenu,
	UiAnnouncement,
	UiAnnouncementExclude,
	
	BtlModel,
	BtlPart,
	BtlUnit,
	BtlAttackRangeHeader,
	BtlAttackRange,
	BtlAttack,
	BtlEventCamera,
	BtlBossAttack,
	BtlPuzzleLevel,
	BtlCheerTerms,
	BtlCheer,
	BtlResourceField,
	BtlResource,
	BtlConfig,
}



export class Pointer {
	private readonly _offset: number
	
	constructor(offset: number) {
		this._offset = offset
	}
	
	toBigInt(): bigint {
		return BigInt(this._offset)
	}
	
	equals(other: any) {
		return other instanceof Pointer && other._offset == this._offset
	}
	
	toString() {
		return this.equals(Pointer.NULL) ? "$null" : `$0x${this._offset.toString(16)}`
	}
	
	get value(): number {
		return this._offset
	}
	
	static fromString(str: string): Pointer | undefined {
		const matches = str.match(/^pointer->((0x)?[\da-fA-F]+)$/)
		
		if (matches === null)
			console.warn(`Matches are null, str ${JSON.stringify(str)}`)
		
		return matches && matches[1] ? new Pointer(parseInt(matches[1])) : undefined
	}
 	
	static NULL: Pointer = new Pointer(Number.MAX_VALUE)
	static ZERO: Pointer = new Pointer(0)
}

