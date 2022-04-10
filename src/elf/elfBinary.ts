import type { Section, Symbol } from "./types"

/**
 * An ELF file
 */
export class ElfBinary {
	private sections: Section[]
	data: Map<ElfBinary.ObjectType, any[]>
	symbolTable: Symbol[]
	modelSymbolReference: WeakMap<object[]|object, string>
	
	private constructor(
		sections: Section[], 
		data: Map<ElfBinary.ObjectType, object[]>, 
		symbolTable: Symbol[], 
		modelSymbolReference: WeakMap<any | any[], string>,
	) {
		this.sections = sections
		this.data = data
		this.symbolTable = symbolTable
		this.modelSymbolReference = modelSymbolReference
	}
}

export namespace ElfBinary {
	export enum ObjectType {
		Main,
		MaplinkNodes,
		
		AssetGroup,
		State,
		SubState,
		Face,
		Anime,
		
		Element,
		Map,
		
		DataHeader,
		Hole,
		Version,
		
		Category,
	}
}


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
		return this.equals(Pointer.NULL) ? "pointer->null" : `pointer->0x${this._offset.toString(16)}`
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

