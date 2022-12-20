import { dataDivisions, DataType, ElfBinary, Pointer } from "./elfBinary";
import { FILE_TYPES } from "./fileTypes";
import type { Struct } from "./fileTypes";
import { BinaryReader, Vector3 } from "./misc";
import { demangle } from "./nameMangling";
import { Relocation, Section, Symbol } from "./types";

type Typedef<T> = {[fieldName: string]: T}

export class EmptyFileError extends Error {
	constructor(message: any) {
		super(message)
		this.name = "EmptyFileError"
	}
}

export default function parseElfBinary(dataType: DataType, arrayBuffer: ArrayBuffer): ElfBinary {
	const view = new DataView(arrayBuffer)
	const reader = new BinaryReader(view)
	
	// In order to parse the contents of the ELF file, we need to understand the file structure
	// it is like this: Header, Sections..., Section Header Table (metadata about sections)
	// there are also sectors but those are for executables only, so we can ignore them
	
	// all of the content of the file is in the sections, so we need to parse them first
	
	
	// parse sections
	const sectionHeaderTableOffset = view.getBigInt64(0x28, true)
	const sectionAmount = view.getInt16(0x3c, true)
	
	reader.position = Number(sectionHeaderTableOffset)
	
	let sections: Section[] = []
	
	for (let i = 0; i < sectionAmount; i++) {
		let section = new Section(reader)
		section.content = arrayBuffer.slice(section.offset, section.offset + section.size)
		sections.push(section)
	}
	
	// get section names
	const stringSectionIndex = view.getInt16(0x3e, true)
	const stringSection = sections[stringSectionIndex]
	
	for (const section of sections) {
		section.name = stringSection.getStringAt(section.namePointer)
	}
	
	
	// in order to parse the content, we have to parse the relocations as well
	// whenever in the data there is pointer, it is replaced with just zero and instead, a relocation entry is made
	// the relocation describes where the pointer should be stored in and where it points to (the section and offset)
	// because the section it points to is very predictable, we can read the offset and store it in the original location of the pointer
	
	let allRelocations = new Map<string, Map<number, Relocation>>()
	
	// find all sections that start with ".rela" (e.g. '.rela.data') because those contain the relocations
	for (const section of sections) {
		
		if (section.name.startsWith(".rela")) {
			let reader = new BinaryReader(section.content)
			let relocations = new Map()
			
			while (reader.position < section.content.byteLength) {
				let relocation = Relocation.fromBinaryReader(reader)
				relocations.set(relocation.locationOffset.value, relocation)
			}
			
			allRelocations.set(section.name.slice(".rela".length), relocations)
		}
	}
	
	
	// even though the relocation table makes constant references to the symbol table through the 'info' field,
	// we actually don't need to know the symbol table content to understand the relocations.
	// the info field is very predictable and usually just one constant throughout the entire relocation table
	
	// however, there are certain file types (maplink and data_npc_model, among others) that require the symbol table
	// because they contain multiple data types in the same file, whose placement is indicated by the symbol table
	
	const symTab = sections.find(section => section.name == ".symtab")
	let symbolTable: Symbol[] = []
	let symTabReader = new BinaryReader(symTab.content)
	
	while (symTabReader.position < symTab.content.byteLength) {
		let symbol = new Symbol(symTabReader, stringSection)
		symbolTable.push(symbol)
	}
	
	
	
	// Some files don't contain a .data section. In this case, there is nothing else to do than error.
	// However, data_confetti_hole_totalInfo.elf doesn't contain a .data type by default, so this is ignored here
	if (dataType != DataType.DataConfettiTotalHoleInfo && sections.filter(section => section.name == '.data').length === 0) {
		throw new EmptyFileError("No .data section existant")
	}
	
	// for most of the file formats, the data is stored in the .data section
	// as an array of structs. However, for some file formats (like maplink and data_npc_model),
	// there are multiple file formats
	
	let data: {[division in keyof typeof dataDivisions]?: any[]}
	let modelSymbolReference: WeakMap<any | any[], string>
	
	
	// Parses the .rodata section from a data_x_model file, since these are always the same and can be reused
	function parseModelRodata(data: {[division in keyof typeof dataDivisions]?: any[]}, rodataSection: Section, modelFilesIndices: [Pointer, number][], stateIndices: [Pointer, number][]) {
		const dataStringSection = findSection('.rodata.str1.1')
		
		// Why have I been doing it like this anyway?
		// Wouldn't it be smarter to go through each NPC model, parse its asset groups and states,
		// then link them back to the original model and then do this recursively for all child objects?
		// Not even necessarily recursively, just nested instead of this very linear approach
		// So kind of like how I've been doing it in the serializer
		function parseObjectsByIndices(dataType: DataType, indices: [Pointer, number][], offsetReference?: Map<number, any>) {
			return indices.map(([ offset, count ]) => {
				let result = applyStrings(
					offset,
					dataType, 
					dataStringSection, 
					allRelocations.get('.rodata'), 
					
					parseRawDataSection(rodataSection, count, offset.value, FILE_TYPES[dataType].typedef), 
				)
				
				offsetReference?.set(offset.value, result)
				
				return result
			})
		}
		
		let modelFilesByOffset: Map<number, any> = new Map()
		let modelFiles = parseObjectsByIndices(DataType.NpcFiles, modelFilesIndices, modelFilesByOffset)
		
		data[dataDivisions.assetGroup] = modelFiles
		
		// Replace pointers in Main with the objects they're pointing to
		for (const instance of data[dataDivisions.main]) {
			instance.assetGroups = modelFilesByOffset.get((instance.assetGroups as Pointer).value)
		}
		
		
		let statesByOffset = new Map()
		let states = parseObjectsByIndices(DataType.NpcState, stateIndices, statesByOffset)
		
		data[dataDivisions.state] = states
		
		for (const instance of data[dataDivisions.main]) {
			instance.states = statesByOffset.get(instance.states.value)
		}
		
		
		let substateIndices: [Pointer, number][] = states.flat().map(obj => [obj.substates, obj.substateCount])
		let substatesByOffset = new Map()
		
		let substates = parseObjectsByIndices(DataType.NpcSubState, substateIndices, substatesByOffset)
		
		data[dataDivisions.subState] = substates
		
		for (const instance of states.flat()) {
			instance.substates = substatesByOffset.get(instance.substates.value)
		}
		
		
		
		let faceIndices: [Pointer, number][] = substates.flat().map(obj => [obj.faces, obj.faceCount])
		let facesByOffset = new Map()
		
		let faces = parseObjectsByIndices(DataType.NpcFace, faceIndices, facesByOffset)
		
		data[dataDivisions.face] = faces
		
		for (const instance of substates.flat()) {
			instance.faces = facesByOffset.get(instance.faces.value)
		}
		
		
		let animeIndices: [Pointer, number][] = faces.flat().map(obj => [obj.animations, obj.animationCount])
		let animesByOffset = new Map()
		
		let animes = parseObjectsByIndices(DataType.NpcAnime, animeIndices, animesByOffset)
		
		data[dataDivisions.anime] = animes
		
		for (const instance of faces.flat()) {
			instance.animations = animesByOffset.get(instance.animations.value)
		}

	}
	
	function findSection(sectionName: string): Section {
		return sections.find(section => section.name == sectionName)
	}
	
	function findSymbol(name: string): Symbol {
		return symbolTable.find(symbol => demangle(symbol.name) === name)
	}
	
	// parse data according to data type
	switch (dataType) {
		case DataType.None:
			data = null
			break
		
		case DataType.Maplink: {
			const dataSection = findSection('.data')
			const dataStringSection = findSection('.rodata.str1.1')
			
			let headerOffset = new Pointer(dataSection.size - FILE_TYPES[DataType.MaplinkHeader].size)
			
			data = {}
			
			let header = applyStrings(
				headerOffset,
				DataType.MaplinkHeader,
				dataStringSection,
				allRelocations.get('.data'),
				
				parseRawDataSection(dataSection, 1, headerOffset.value, FILE_TYPES[DataType.MaplinkHeader].typedef)
			)
			
			data[dataDivisions.main] = header
			
			data[dataDivisions.maplinkNodes] = applyStrings(
				Pointer.ZERO,
				DataType.Maplink,
				dataStringSection,
				allRelocations.get('.data'),
				
				parseRawDataSection(dataSection, header[0].linkAmount, 0, FILE_TYPES[DataType.Maplink].typedef)
			)
			
			break
		}
		
		case DataType.DataNpcModel:
		case DataType.DataItemModel:
		case DataType.DataGobjModel:
		case DataType.DataHarikoModel:
		case DataType.DataNaviModel:
		case DataType.DataMobjModel:
		case DataType.DataPlayerModel:
		{
			const dataSection = findSection('.data')
			const rodataSection = findSection('.rodata')
			const dataStringSection = findSection('.rodata.str1.1')
			
			let rodataView = new DataView(rodataSection.content)
			
			// object count in .data is stored somewhere in .rodata, at symbol wld::fld::data::modelNpc_num
			// because of name mangling, this equals _ZN3wld3fld4dataL12modelNpc_numE
			let countSymbol = findSymbol(FILE_TYPES[dataType].countSymbol)
			const dataCount = Number(rodataView.getBigInt64(countSymbol.location.value, true))
			
			data = {}
			data[dataDivisions.main] = applyStrings(
				Pointer.ZERO, dataType, dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, dataCount, 0, FILE_TYPES[dataType].typedef), 
			)
			
			modelSymbolReference = new WeakMap(data[dataDivisions.main].map(obj => [obj, obj.id as string]))
			
			let modelFilesIndices: [Pointer, number][] = data[dataDivisions.main].map((obj: any) => [obj.assetGroups, obj.assetGroupCount])
			let stateIndices: [Pointer, number][] = data[dataDivisions.main].map((obj: any) => [obj.states, obj.stateCount])
			
			parseModelRodata(data, rodataSection, modelFilesIndices, stateIndices)
			
			break
		}
		
		case DataType.DataBtlSet: {
			// this file type doesn't have a .rodata section at all
			const dataSection = findSection('.data')
			const dataStringSection = findSection('.rodata.str1.1')
			
			// this file type doesn't contain any standalone information. everything is clearly marked
			// by symbols. Examples include s_setElementData_W0C1_CG_KUR_01.
			
			// update: it does? wld::btl::data::s_setDataTable
			// wow. I def. have to remake this parser. it is awful
			// and the editor too
			
			let symbolOffsets: {[symbolName: string]: {offset: Pointer, size: number}} = {}
			let childSymbols: string[] = []
			let categories: {[category: string]: string[]} = {}
			
			const sortedSymbolTable = [...symbolTable]
			for (const symbol of sortedSymbolTable.sort((a, b) => a.location.value - b.location.value)) {
				if (symbol.sectionHeaderIndex != 3 || !symbol.location.equals(Pointer.ZERO)) {
					let id = demangle(symbol.name)
					
					symbolOffsets[id] = {
						offset: symbol.location,
						size: symbol.size,
					}
					
					if (id.startsWith('wld::btl::data::s_setData_battle_')) {
						categories[id.slice('wld::btl::data::s_setData_battle_'.length)] = childSymbols
						childSymbols = []
					} else if (id.startsWith('wld::btl::data::s_setElementData_')) {
						childSymbols.push(id.slice('wld::btl::data::s_setElementData_'.length))
					} else {
						console.error(id)
					}
				}
			}
			
			let mapSymbols = symbolTable
				.filter(sym => sym.sectionHeaderIndex == 3 && sym.location.equals(Pointer.ZERO))
				.sort((a, b) => a.location.value - b.location.value)
				.map(sym => demangle(sym.name))
			
			console.log('stage symbols', mapSymbols)
			console.log('categories', categories)
			
			let setDataObjects = Object.entries(categories).map(([categoryId, objects]) => {
				let symbolName = 'wld::btl::data::s_setData_battle_' + categoryId
				let { offset, size } = symbolOffsets[symbolName]
				let count = size / FILE_TYPES[DataType.BtlSetCategory].size
				
				return {
					symbolName,
					childObjects: [],
					objects: applyStrings(
						offset,
						DataType.BtlSetCategory, 
						dataStringSection, 
						allRelocations.get('.data'), 
						
						parseRawDataSection(dataSection, count, offset.value, FILE_TYPES[DataType.BtlSetCategory].typedef), 
					)
				}
			})
			
			let setDataReference = Object.fromEntries(setDataObjects.map(obj => [obj.symbolName, obj]))
			
			console.log('setDataObjects', setDataObjects)
			
			let elementObjects = Object.entries(categories)
				.flatMap(([categoryId, objects]) =>
					objects.map(id => {
						let symbolName = 'wld::btl::data::s_setElementData_' + id
						let { offset, size } = symbolOffsets[symbolName]
						
						let count = size / FILE_TYPES[DataType.BtlSetElement].size
						
						let result = {
							symbolName,
							objects: applyStrings(
								offset,
								DataType.BtlSetElement, 
								dataStringSection, 
								allRelocations.get('.data'), 
								
								parseRawDataSection(dataSection, count, offset.value, FILE_TYPES[DataType.BtlSetElement].typedef), 
							),
						}
						
						let category = setDataReference['wld::btl::data::s_setData_battle_' + categoryId]
						category.childObjects.push(result)
						
						return result
					}))
			
			console.log('elementObjects', elementObjects)
			
			data = {}
			data[dataDivisions.main] = setDataObjects
			data[dataDivisions.element] = elementObjects
			data[dataDivisions.map] = mapSymbols
			
			break
		}
		
		case DataType.DataItemSet: {
			const dataSection = findSection('.data')
			const dataStringSection = findSection('.rodata.str1.1')
			
			// Because data_item_set doesn't contain a .rodata section,
			// the object count is determined through the data section size
			let count: number = dataSection.size / FILE_TYPES[dataType].size - 1
			
			data = {}
			data[dataDivisions.main] = applyStrings(
				Pointer.ZERO, dataType, dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, count, 0, FILE_TYPES[dataType].typedef), 
			)
			
			break
		}
		
		case DataType.DataConfettiTotalHoleInfo: {
			// data_confetti_hole_totalInfo doesn't have a .data section
			const rodataSection = findSection('.rodata')
			const dataStringSection = findSection('.rodata.str1.1')
			
			let rodataView = new DataView(rodataSection.content)
			
			data = {}
			
			// version is simply a 64-bit integer with the value 11
			const versionSymbol = findSymbol("confetti::data::hole::s_version")
			const version = Number(rodataView.getBigInt64(versionSymbol.location.value, true))
			
			data[dataDivisions.version] = [{ version }]
			
			// data is the main entry point for this file type
			const dataSymbol = findSymbol("confetti::data::hole::data")
			const dataArray: Struct<DataType.ConfettiData>[] = applyStrings(
				dataSymbol.location, DataType.ConfettiData, dataStringSection,
				allRelocations.get('.rodata'), 
				
				parseRawDataSection(rodataSection, 1, dataSymbol.location.value, FILE_TYPES[DataType.ConfettiData].typedef), 
			)
			
			data[dataDivisions.dataHeader] = dataArray
			
			// map list
			const { maps: mapListOffset, mapCount } = dataArray[0]
			console.log('maps', mapListOffset, mapCount)
			const maps: Struct<DataType.ConfettiMap>[] = applyStrings(
				mapListOffset, DataType.ConfettiMap, dataStringSection,
				allRelocations.get('.rodata'), 
				
				parseRawDataSection(rodataSection, mapCount, mapListOffset.value, FILE_TYPES[DataType.ConfettiMap].typedef), 
			)
			console.log(maps)
			
			data[dataDivisions.map] = maps
			dataArray[0].maps = maps
			
			// holes
			let holesByOffset: Map<number, any> = new Map()
			
			const holes = maps.map(map => {
				const { holes: holeOffset, holeCount } = map
				let result = applyStrings(
					holeOffset, DataType.ConfettiHole, dataStringSection,
					allRelocations.get('.rodata'), 
					
					parseRawDataSection(rodataSection, holeCount, holeOffset.value, FILE_TYPES[DataType.ConfettiHole].typedef), 
				)
				
				holesByOffset.set(holeOffset.value, result)
				return result
			})
			
			data[dataDivisions.hole] = holes
			
			// fix references to holes
			for (const map of maps) {
				map.holes = holesByOffset.get(map.holes.value)
			}
			
			break
		}
		
		case DataType.DataEffect: {
			const dataStringSection = findSection('.rodata.str1.1')
			const rodataSection = findSection('.rodata')
			
			let rodataView = new DataView(rodataSection.content)
			
			const categoryCountSymbol = findSymbol('eft::data::s_categoryCount')
			const categoryCount = rodataView.getInt32(categoryCountSymbol.location.value, true)
			
			
			// .data section exclusively contains an array of strings (category names)
			// count of items in .data is determined by categoryCount Symbol
			
			// because it exclusively contains relocations, we can ignore data section completely
			// and just focus on .rela.data
			let categories: string[] = []
			for (const [offset, relocation] of allRelocations.get('.data')) {
				categories.push(dataStringSection.getStringAt(relocation.targetOffset))
			}
			
			data = {}
			data[dataDivisions.category] = categories
			
			
			// .rodata contains actual main data (under symbol dataSymbol)
			const dataCountSymbol = findSymbol("eft::data::s_dataCount")
			const dataCount = rodataView.getInt32(dataCountSymbol.location.value, true)
			
			const dataSymbol = findSymbol("eft::data::s_data")
			const dataObjects = applyStrings(
				dataSymbol.location, dataType, dataStringSection,
				allRelocations.get('.rodata'), 
				
				parseRawDataSection(rodataSection, dataCount, dataSymbol.location.value, FILE_TYPES[dataType].typedef), 
			)
			
			data[dataDivisions.main] = dataObjects
			
			break
		}
		
		case DataType.DataUi: {
			const dataSection = findSection('.data')
			const dataStringSection = findSection('.rodata.str1.1')
			const rodataSection = findSection('.rodata')
			
			let rodataView = new DataView(rodataSection.content)
			
			data = {}
			
			// automated parsing
			// this is awful
			// TODO: undo this
			for (const [dataDivision, entryPoint] of Object.entries(FILE_TYPES[dataType].entryPoints)) {
				let symbol = findSymbol(entryPoint.symbol)
				let count = entryPoint.count ?? symbol.size / FILE_TYPES[entryPoint.dataType].size
				
				let section = entryPoint.section == ".rodata" ? rodataSection : dataSection
				
				let rawObjects = applyStrings(
					symbol.location, entryPoint.dataType, dataStringSection, 
					allRelocations.get(entryPoint.section), 
					
					parseRawDataSection(section, count, symbol.location, FILE_TYPES[entryPoint.dataType].typedef), 
				)
				
				let objects = entryPoint.cutoff ? rawObjects.slice(0, -entryPoint.cutoff) : rawObjects
				
				data[dataDivision] = objects
				
				// children
				for (const [fieldName, child] of Object.entries(entryPoint.children ?? {}) as [string, any][]) {
					let childrenByKey: Map<number|string, any> = new Map()
			
					let filtered = objects.filter(obj => obj[fieldName] != Pointer.NULL && obj[fieldName] != null)
					let children = filtered.map(obj => {
						let childKey = obj[fieldName]
						let count = obj[child.count]
						
						let offset = childKey
						
						if (FILE_TYPES[entryPoint.dataType].typedef[fieldName] == "symbol") {
							// debugger
							let symbol = findSymbol(obj[fieldName])
							offset = symbol.location
						}
						
						let section = entryPoint.section == ".rodata" ? rodataSection : dataSection
						
						let result = applyStrings(
							offset, child.dataType, dataStringSection,
							allRelocations.get(child.section), 
							
							parseRawDataSection(section, count, offset, FILE_TYPES[child.dataType].typedef), 
						)
						
						childrenByKey.set(childKey?.value ?? childKey, result)
						return result
					})
					
					data[child.objectType] = children
					
					// fix references to properties
					for (const obj of objects) {
						obj[fieldName] = childrenByKey.get(obj[fieldName]?.value ?? obj[fieldName]) ?? null
					}
				}
			}
			
			// menu data
			let menuDataCountSymbol = findSymbol("wld::fld::data::kMenuDataCount")
			let menuCount = rodataView.getInt32(menuDataCountSymbol.location.value, true)
			
			let menuDataSymbol = findSymbol("wld::fld::data::s_menuData")
			
			let menus: Struct<DataType.UiMenu>[] = applyStrings(
				menuDataSymbol.location, DataType.UiMenu,  dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, menuCount, menuDataSymbol.location, FILE_TYPES[DataType.UiMenu].typedef),
			)
			
			data[dataDivisions.menu] = menus
			
			// announcement data
			let announcementCountSymbol = findSymbol("wld::fld::data::kAnnounceDataCount")
			let announcementCount = rodataView.getInt32(announcementCountSymbol.location.value, true)
			
			let announcementSymbol = findSymbol("wld::fld::data::s_announceData")
			
			let announcements: Struct<DataType.UiAnnouncement>[] = applyStrings(
				announcementSymbol.location, DataType.UiAnnouncement,  dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, announcementCount, announcementSymbol.location, FILE_TYPES[DataType.UiAnnouncement].typedef),
			)
			
			data[dataDivisions.announcement] = announcements
			
			// announcement excludes
			let announcementExcludeCountSymbol = findSymbol("wld::fld::data::kAnnounceExcludeDataCount")
			let announcementExcludeCount = rodataView.getInt32(announcementExcludeCountSymbol.location.value, true)
			
			let announcementExcludeSymbol = findSymbol("wld::fld::data::s_announceExcludeData")
			
			let announcementExcludes: Struct<DataType.UiAnnouncementExclude>[] = applyStrings(
				announcementExcludeSymbol.location, DataType.UiAnnouncementExclude,  dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, announcementExcludeCount, announcementExcludeSymbol.location, 
					FILE_TYPES[DataType.UiAnnouncementExclude].typedef),
			)
			
			data[dataDivisions.announcementExclude] = announcementExcludes
			
			break
		}
		
		case DataType.DataBtl: {
			const dataSection = findSection('.data')
			const stringSection = findSection('.rodata.str1.1')
			const rodataSection = findSection('.rodata')
			
			data = {}
			
			let modelSymbol = findSymbol("wld::btl::data::s_modelBattle")
			// TODO: generalize first 2 arguments into class SectionSource
			let models = parseSymbol(dataSection, stringSection, modelSymbol, DataType.BtlModel, -1)
			data[dataDivisions.model] = models
			
			let partsSymbol = findSymbol("wld::btl::data::s_partsData")
			let parts = parseSymbol(dataSection, stringSection, partsSymbol, DataType.BtlPart, -1)
			data[dataDivisions.part] = parts
			
			let unitSymbol = findSymbol("wld::btl::data::s_unitData")
			let units = parseSymbol(dataSection, stringSection, unitSymbol, DataType.BtlUnit, -1)
			data[dataDivisions.unit] = units
			
			// attack range
			let attackRangeHeaderSymbol = findSymbol("wld::btl::data::s_weaponRangeDataTable")
			let attackRangeHeader = parseSymbol(dataSection, stringSection, attackRangeHeaderSymbol, DataType.BtlAttackRangeHeader, -1)
			data[dataDivisions.attackRangeHeader] = attackRangeHeader
			
			let attackRanges = []
			
			for (const headerNode of attackRangeHeader as Struct<DataType.BtlAttackRangeHeader>[]) {
				let attackRangeSymbol = findSymbol(headerNode.attackRange)
				let offset = attackRangeSymbol.location
				
				let [ item ] = applyStrings(
					offset, DataType.BtlAttackRange, stringSection, 
					allRelocations.get('.data'), 
					
					parseRawDataSection(dataSection, 1, offset, FILE_TYPES[DataType.BtlAttackRange].typedef), 
				)
				
				let attackRange = {
					symbolName: `wld::btl::data::s_weaponRangeData_${headerNode.id}`,
					item,
				}
				
				attackRanges.push(attackRange)
				headerNode.attackRange = attackRange
			}
			
			data[dataDivisions.attackRange] = attackRanges
			
			let weaponSymbol = findSymbol("wld::btl::data::s_weaponData")
			let weapons = parseSymbol(dataSection, stringSection, weaponSymbol, DataType.BtlAttack, -1)
			data[dataDivisions.attack] = weapons
			
			let eventCameraSymbol = findSymbol("wld::btl::data::s_eventCameraData")
			let eventCameras = parseSymbol(dataSection, stringSection, eventCameraSymbol, DataType.BtlEventCamera, -1)
			data[dataDivisions.eventCamera] = eventCameras
			
			let bossAttackSymbol = findSymbol("wld::btl::data::s_godHandData")
			let bossAttacks = parseSymbol(dataSection, stringSection, bossAttackSymbol, DataType.BtlBossAttack, -1)
			data[dataDivisions.bossAttack] = bossAttacks
			
			let puzzleLevelSymbol = findSymbol("wld::btl::data::s_puzzleLevelData")
			let puzzleLevels = parseSymbol(dataSection, stringSection, puzzleLevelSymbol, DataType.BtlPuzzleLevel, -1)
			data[dataDivisions.puzzleLevel] = puzzleLevels
			
			let cheerTermsSymbol = findSymbol("wld::btl::data::s_cheerTermsData")
			let cheerTerms = parseSymbol(dataSection, stringSection, cheerTermsSymbol, DataType.BtlCheerTerms, -1)
			data[dataDivisions.cheerTerm] = cheerTerms
			
			let cheerSymbol = findSymbol("wld::btl::data::s_cheerData")
			let cheers = parseSymbol(dataSection, stringSection, cheerSymbol, DataType.BtlCheer, -1)
			data[dataDivisions.cheer] = cheers
			
			// resources
			let resourceFieldSymbol = findSymbol("wld::btl::data::s_resourceData")
			let resourceFields = parseSymbol(dataSection, stringSection, resourceFieldSymbol, DataType.BtlResourceField, -1)
			data[dataDivisions.resourceField] = resourceFields
			
			let allResources = []
			
			for (const resourceField of resourceFields as Struct<DataType.BtlResourceField>[]) {
				if (resourceField.resources == undefined)
					continue
				
				let resourceSymbol = findSymbol(resourceField.resources)
				let resources = parseSymbol(dataSection, stringSection, resourceSymbol, DataType.BtlResource, resourceField.resourceCount)
				
				let resourcesObj = {
					symbolName: `wld::btl::data::s_weaponRangeData_${resourceField.id}`,
					children: resources,
				}
				
				allResources.push(resourcesObj)
				resourceField.resources = resourcesObj
			}
			
			data[dataDivisions.resource] = allResources
			
			let configSymbol = findSymbol("wld::btl::data::s_configData")
			let configs = parseSymbol(dataSection, stringSection, configSymbol, DataType.BtlConfig, -1)
			data[dataDivisions.config] = configs
			
			break
		}
		
		// parse .data section by data type
		default: {
			const dataSection = findSection('.data')
			const dataStringSection = findSection('.rodata.str1.1')
			const rodataSection = findSection('.rodata')
			
			// the .rodata Section usually only contains 4 bytes, which are the amount of objects in .data
			let rodataView = new DataView(rodataSection.content)
			let count = rodataView.getInt32(0, true)
			
			data = {}
			data[dataDivisions.main] = applyStrings(
				Pointer.ZERO, dataType,  dataStringSection, 
				allRelocations.get('.data'), 
				
				parseRawDataSection(dataSection, count, 0, FILE_TYPES[dataType].typedef), 
			)
			
			break
		}
	}
	
	console.log('data', data)
	
	return new ElfBinary(sections, data, symbolTable, modelSymbolReference)
	
	
	function parseSymbol(containingSection: Section, stringSection: Section, symbol: Symbol, dataType: DataType, count?: number) {
		// if count is smaller than zero, calculate size like normal and subtract negative value from it
		let subtract = 0
		
		if (count < 0) {
			subtract = Math.abs(count)
			count = undefined
		}
		
		count = count ?? symbol.size / FILE_TYPES[dataType].size - subtract
		
		return applyStrings(
			symbol.location, dataType, stringSection, allRelocations.get(containingSection.name), 
			
			parseRawDataSection(containingSection, count, symbol.location, FILE_TYPES[dataType].typedef),
		)
	}
	
	
	function applyStrings(baseOffsetPointer: Pointer, dataType: DataType, stringSection: Section, relocationTable: Map<number, Relocation>, objects: object[]) {
		let result = []
		
		const baseOffset = baseOffsetPointer.value
		
		for (const [offset, relocation] of relocationTable) {
			if (offset >= baseOffset && offset < baseOffset + FILE_TYPES[dataType].size * objects.length) {
				let size = FILE_TYPES[dataType].size
				let fieldOffset = (offset -  baseOffset) % size
				let fieldName = FILE_TYPES[dataType].fieldOffsets[fieldOffset]
				
				if (FILE_TYPES[dataType].typedef[fieldName] != "string" 
					&& FILE_TYPES[dataType].typedef[fieldName] != "pointer"
					&& FILE_TYPES[dataType].typedef[fieldName] != "symbol") {
					console.error(`Field ${fieldName} should be a string instead of ${FILE_TYPES[dataType].typedef[fieldName]} \
(found in item ${Math.floor((offset - baseOffset) / size)}) ${DataType[dataType]} (0x${offset.toString(16)} / 0x${baseOffset.toString(16)})`)
				}
			}
		}
		
		for (let i = 0; i < objects.length; i++) {
			const obj = objects[i]
			
			let copy = {...obj}
			Object.setPrototypeOf(copy, Object.getPrototypeOf(obj))
			
			for (const [fieldName, fieldType] of Object.entries(FILE_TYPES[dataType].typedef)) {
				if (fieldType == "string") {
					let fieldOffset = FILE_TYPES[dataType].fieldOffsets[fieldName] as number
					let size = FILE_TYPES[dataType].size as number
					let relocation: Relocation = relocationTable.get(fieldOffset + size * i + baseOffset)
					
					copy[fieldName] = stringSection.getStringAt(relocation ? relocation.targetOffset : Pointer.NULL)
				} 
				else if (fieldType == "symbol") {
					let fieldOffset = FILE_TYPES[dataType].fieldOffsets[fieldName] as number
					let size = FILE_TYPES[dataType].size as number
					let relocation: Relocation = relocationTable.get(fieldOffset + size * i + baseOffset)
					let targetSymbol = symbolTable[relocation?.infoHigh]
					
					// console.log('symbol', relocation?.infoHigh, symbolTable)
					
					copy[fieldName] = demangle(targetSymbol?.name) ?? null
				} 
				else if (fieldType == "pointer") {
					let fieldOffset = FILE_TYPES[dataType].fieldOffsets[fieldName] as number
					let size = FILE_TYPES[dataType].size as number
					let relocation: Relocation = relocationTable.get(fieldOffset + size * i + baseOffset)
					copy[fieldName] = relocation ? relocation.targetOffset : Pointer.NULL
				}
			}
			
			result.push(copy)
		}
		
		return result
	}
}


function parseRawDataSection(section: Section, count: number, initialPosition: number | Pointer, typedef: Typedef<string>): object[] {
	const reader = new BinaryReader(section.content)
	
	reader.position = initialPosition instanceof Pointer ? initialPosition.value : initialPosition
	
	let result = []
	let i = 0
	
	while (reader.position < section.content.byteLength && i < count) {
		result.push(objFromReader(reader, typedef))
		i += 1
	}
	
	return result
	
	function objFromReader(reader: BinaryReader, typedef: {[fieldName: string]: string}): object {
		let result = {}
		
		for (const [fieldName, fieldType] of Object.entries(typedef)) {
			
			switch (fieldType) {
				case "string":
					result[fieldName] = null
					reader.position += 8
					break
				case "symbol":
					result[fieldName] = null
					reader.position += 8
					break
				case "pointer":
					result[fieldName] = null
					reader.position += 8
					break
				case "Vector3":
					result[fieldName] = new Vector3(reader.readFloat32(), reader.readFloat32(), reader.readFloat32())
					break
				case "float":
					result[fieldName] = reader.readFloat32()
					break
				case "double":
					result[fieldName] = reader.readFloat64()
					break
				case "byte":
					result[fieldName] = reader.readUint8()
					break
				case "bool8":
					result[fieldName] = !!reader.readUint8()
					break
				case "bool32":
					result[fieldName] = !!reader.readUint32()
					break
				case "short":
					result[fieldName] = reader.readInt16()
					break
				case "int":
					result[fieldName] = reader.readInt32()
					break
				case "long":
					result[fieldName] = Number(reader.readBigInt64())
					break
				
				default:
					throw new Error(`Unknown data type ${JSON.stringify(fieldType)}`)
			}
			
		}
		
		return result
	}
}
