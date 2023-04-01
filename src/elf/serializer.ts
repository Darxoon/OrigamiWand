import { DataType, ElfBinary, Pointer } from "./elfBinary";
import { FILE_TYPES } from "./fileTypes";
import type { Instance } from "./fileTypes";
import { BinaryWriter } from "./misc";
import { Relocation, Section, Symbol } from "./types";
import { demangle, mangleIdentifier } from "./nameMangling";
import { enumerate, noUndefinedMap } from "./util";

type SectionName = string
type Offset = number
type SymbolName = string

const BINARY_HEADER: Uint8Array = new Uint8Array([
	0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	
	0x01, 0x00, 0xB7, 0x00, 0x01, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	0xC8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	
	0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x40, 0x00, 0x0B, 0x00, 0x01, 0x00,
])


export default function serializeElfBinary(dataType: DataType, binary: ElfBinary): ArrayBuffer {
	// In order to serialize an ELF binary, we don't have to regenerate the entire file.
	// All we need to do is change the things that need to be changed and then reconstruct
	// the foundation.
	// This means that we need to serialize the these sections:
	//  - .data (contains main content)
	//  - .rodata (contains count of items in .data and optional secondary content)
	//  - .rodata.str1.1 (contains all custom strings)
	//  - .rela* (relocation tables for all sections that need one )
	//  - symbol table (required for maplink and data_npc_model.elf)
	
	const updatedSections: Map<SectionName, ArrayBuffer> = new Map()
	const allStrings: Set<string> = new Set()
	
	const allRelocations: Map<SectionName, Relocation[]> = new Map()
	const stringRelocations: Map<SectionName, Map<number, string>> = new Map()
	const objectRelocations: Map<SectionName, Map<number, object>> = new Map()
	const symbolRelocations: Map<SectionName, Map<number, SymbolName>> = new Map()
	
	const objectOffsets: WeakMap<object, Pointer> = new WeakMap()
	
	// TODO: use noUndefinedMap only in development builds
	const symbolLocationReference: Map<string, Pointer> = noUndefinedMap(new Map())
	// TODO: use this everywhere
	const symbolNameOverrides: Map<string, string> = noUndefinedMap(new Map())
	// TODO: use this everywhere
	const symbolSizeOverrides: Map<string, number> = noUndefinedMap(new Map())
	
	function findSection(sectionName: string): Section {
		return sections.find(section => section.name == sectionName)
	}
	
	function findSymbol(name: string): Symbol {
		return binary.symbolTable.find(symbol => demangle(symbol.name) === name)
	}
	
	// We will start with the .data section
	// Because it is just an array of structs, serializing it is relatively straight forward
	
	// Although the .data section contains pointers, which would require the .rodata.str1.1
	// section to exist first in order to know where exactly the pointers point to,
	// this doesn't cause any problems, as no actual pointer information is stored here.
	// It is stored in .rela.data, which will be generated after .rodata.str1.1.
	
	// However, we need to note which strings exist, so they can all be written into .rodata.str1.1.
	
	{
		let dataWriter = new BinaryWriter()
		
		let dataStringRelocations = new Map() as Map<Offset, string>
		stringRelocations.set(".data", dataStringRelocations)
		
		switch (dataType) {
			case DataType.Maplink: {
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: undefined,
				}
				
				serializeObjects(data, dataType, [
					...binary.data.maplinkNodes,
					FILE_TYPES[DataType.Maplink].instantiate()
				])
				
				serializeObjects(data, DataType.MaplinkHeader, 
					binary.data.main)
				
				break
			}
			
			case DataType.DataBtlSet: {
				// TODO: remake this to use normal symbolRelocations instead of its own thing
				
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: undefined,
					symbolRelocations: new Map(),
				}
				
				for (const category of binary.data.main) {
					const { childObjects, objects, symbolName } = category
					
					for (const battle of childObjects) {
						const { objects, symbolName } = battle
						
						let symbol = findSymbol(symbolName)
												
						if (symbol) {
							symbol.location = new Pointer(dataWriter.size)
							symbol.size = FILE_TYPES[DataType.BtlSetElement].size * objects.length
						} else {
							console.warn("Could not find symbol for " + symbolName)
						}
						
						serializeObjects(data, DataType.BtlSetElement, objects)
					}
					
					let symbol = findSymbol(symbolName)
												
					if (symbol) {
						symbol.location = new Pointer(dataWriter.size)
						symbol.size = FILE_TYPES[DataType.BtlSetCategory].size * objects.length
					} else {
						console.warn("Could not find symbol for " + symbolName)
					}
					
					serializeObjects(data, DataType.BtlSetCategory, objects)
				}
				
				// data table
				for (const { symbolName } of binary.data.main) {
					data.symbolRelocations.set(dataWriter.size, symbolName)
					dataWriter.writeBigInt64(0n)
				}
				
				dataWriter.writeBigInt64(0n)
				
				
				// relocations towards custom symbols
				// would probably would make more sense where the other relocations are generated but who cares
				let dataRelocations: Relocation[] = []
				allRelocations.set('.data', dataRelocations)
				
				let symbolReference = Object.fromEntries(binary.symbolTable.map((symbol, index) => [demangle(symbol.name), index]))
				
				for (const [offset, symbolName] of data.symbolRelocations) {
					dataRelocations.push(new Relocation(new Pointer(offset), 0x101, symbolReference[symbolName], Pointer.ZERO))
				}
				
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
				let dataRelocations = new Map()
				objectRelocations.set('.data', dataRelocations)
				
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: dataRelocations,
				}
				
				serializeObjects(data, dataType, binary.data.main)
				serializeObjects(data, dataType, [FILE_TYPES[dataType].instantiate()])
				
				let rodataReferences = binary.data.main.map(npc => 
					[npc.id, binary.modelSymbolReference.get(npc), npc.assetGroups, npc.states] as RodataReference)
				
				let rodata: SectionElements = {
					writer: new BinaryWriter(),
					stringRelocations: new Map(),
					crossPointers: new Map(),
				}
				
				stringRelocations.set('.rodata', rodata.stringRelocations)
				objectRelocations.set('.rodata', rodata.crossPointers)
				
				let serializedRodata = serializeModelRodata(rodataReferences, rodata, binary.data.main.length, "wld::fld::data")
				updatedSections.set('.rodata', serializedRodata)
				
				for (const model of binary.data.main) {
					binary.modelSymbolReference.set(model, model.id)
				}
				
				break
			}
			
			case DataType.DataEffect: {
				// .rodata section contains normal data, dataCount and category count
				{
					let rodata: SectionElements = {
						writer: new BinaryWriter(),
						stringRelocations: new Map(),
						crossPointers: undefined,
					}
					
					serializeObjects(rodata, dataType, binary.data.main)
					
					symbolLocationReference.set("eft::data::s_dataCount", new Pointer(rodata.writer.size))
					rodata.writer.writeInt32(binary.data.main.length)
					
					symbolLocationReference.set("eft::data::s_categoryCount", new Pointer(rodata.writer.size))
					rodata.writer.writeInt32(binary.data.category.length)
					
					stringRelocations.set(".rodata", rodata.stringRelocations)
					updatedSections.set('.rodata', rodata.writer.toArrayBuffer())
				}
				
				// .data section is an array of category name strings
				for (const category of binary.data.category) {
					allStrings.add(category)
					dataStringRelocations.set(dataWriter.size, category)
					
					dataWriter.writeBigInt64(0n)
				}
				break
			}

			case DataType.DataConfettiTotalHoleInfo: {
				const rodataWriter = new BinaryWriter()
				const rodataStringRelocations = new Map() as Map<Offset, string>
				const rodataPointers = new Map()
				
				let rodata: SectionElements = {
					writer: rodataWriter,
					stringRelocations: rodataStringRelocations,
					crossPointers: rodataPointers,
				}
				
				rodataWriter.writeBigInt64(BigInt(binary.data.version[0].version))
				
				serializeObjects(rodata, DataType.ConfettiMap, binary.data.map)
				
				symbolLocationReference.set("confetti::data::hole::data", new Pointer(rodataWriter.size))
				
				serializeObjects(rodata, DataType.ConfettiData, binary.data.dataHeader)
				
				for (const map of binary.data.map as Instance<DataType.ConfettiMap>[]) {
					symbolLocationReference.set(`confetti::data::hole::${map.id}_Hole_List`, new Pointer(rodataWriter.size))

					serializeObjects(rodata, DataType.ConfettiHole, map.holes)
				}
				
				console.log('rodataPointers', rodataPointers)
				
				objectRelocations.set('.rodata', rodataPointers)
				stringRelocations.set(".rodata", rodataStringRelocations)
				updatedSections.set('.rodata', rodataWriter.toArrayBuffer())

				break
			}

			case DataType.DataUi: {
				const dataPointers = new Map()
				objectRelocations.set('.data', dataPointers)
				
				const dataSymbols = new Map()
				symbolRelocations.set('.data', dataSymbols)
				
				// ----------------  data  ----------------
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: dataPointers,
					symbolRelocations: dataSymbols,
				}
				
				// model properties
				for (const model of binary.data.model as Instance<DataType.UiModel>[]) {
					if (model.properties == undefined)
						continue
					
					const properties = model.properties as {children: Instance<DataType.UiModelProperty>[], symbolName: string}
					const { children, symbolName } = properties
					
					let newSymbolName = `wld::fld::data::^s_uiModelPropertyData_${model.id}`
					
					symbolLocationReference.set(symbolName, new Pointer(dataWriter.size))
					symbolNameOverrides.set(symbolName, newSymbolName)
					symbolSizeOverrides.set(symbolName, children.length * FILE_TYPES[DataType.UiModelProperty].size)
					
					properties.symbolName = newSymbolName
					model.propertyCount = children.length
					
					serializeObjects(data, DataType.UiModelProperty, children, { addStrings: false, symbolWrapper: properties })
				}
				
				// model
				symbolLocationReference.set(`wld::fld::data::s_uiModelData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_uiModelData`, (binary.data.model.length + 1) * FILE_TYPES[DataType.UiModel].size)
				serializeObjects(data, DataType.UiModel, binary.data.model, { padding: 1 })
				
				// msg
				symbolLocationReference.set(`wld::fld::data::s_uiMessageData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_uiMessageData`, (binary.data.msg.length + 1) * FILE_TYPES[DataType.UiMsg].size)
				serializeObjects(data, DataType.UiMsg, binary.data.msg, { padding: 1 })
				
				// sell data
				for (const shop of binary.data.shop as Instance<DataType.UiShop>[]) {
					const soldItems = shop.soldItems as { children: Instance<DataType.UiSellItem>[], symbolName: string }
					const { children, symbolName } = soldItems
					
					let newSymbolName = `wld::fld::data::s_sellData_${shop.id}`
					
					symbolLocationReference.set(symbolName, new Pointer(dataWriter.size))
					symbolNameOverrides.set(symbolName, newSymbolName)
					symbolSizeOverrides.set(symbolName, children.length * FILE_TYPES[DataType.UiSellItem].size)
					
					soldItems.symbolName = newSymbolName
					shop.soldItemCount = children.length
					
					serializeObjects(data, DataType.UiSellItem, children, { symbolWrapper: soldItems })
				}
				
				// shops
				symbolLocationReference.set(`wld::fld::data::s_shopData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_shopData`, (binary.data.shop.length + 1) * FILE_TYPES[DataType.UiShop].size)
				serializeObjects(data, DataType.UiShop, binary.data.shop, { padding: 1 })
				
				// TODO: some ideas
				// serializeSymbol(data, `wld::fld::data::s_shopData`, DataType.UiShop, { padding: 1, dataDivision: 'shop', addStrings: false })
				// serializeSymbol(data, `wld::fld::data::s_uiSeaMapData`, DataType.UiSeaMap)
				// serializeChildren(data, DataType.UiShop, 'wld::fld::data::s_sellData_{id}', 'soldItemCount')
				
				// sea map
				symbolLocationReference.set(`wld::fld::data::s_uiSeaMapData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_uiSeaMapData`, (binary.data.seaEntry.length + 1) * FILE_TYPES[DataType.UiSeaMap].size)
				serializeObjects(data, DataType.UiSeaMap, binary.data.seaEntry, { padding: 1 })
				
				// menu
				symbolLocationReference.set(`wld::fld::data::s_menuData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_menuData`, binary.data.menu.length * FILE_TYPES[DataType.UiMenu].size)
				serializeObjects(data, DataType.UiMenu, binary.data.menu)
				
				// announce
				symbolLocationReference.set(`wld::fld::data::s_announceData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_announceData`, binary.data.announcement.length * FILE_TYPES[DataType.UiAnnouncement].size)
				serializeObjects(data, DataType.UiAnnouncement, binary.data.announcement)
				
				// announcement exclude
				symbolLocationReference.set(`wld::fld::data::s_announceExcludeData`, new Pointer(dataWriter.size))
				symbolSizeOverrides.set(`wld::fld::data::s_announceExcludeData`, binary.data.announcementExclude.length
					* FILE_TYPES[DataType.UiAnnouncementExclude].size)
				serializeObjects(data, DataType.UiAnnouncementExclude, binary.data.announcementExclude)
				
				// remaining strings
				for (const model of binary.data.model as Instance<DataType.UiModel>[]) {
					if (model.properties)
						serializeStringsOnly(DataType.UiModelProperty, model.properties.children)
				}
				
				// ----------------  rodata  ----------------
				const rodataWriter = new BinaryWriter()
				
				// array lengths of some .data things
				rodataWriter.writeInt32(binary.data.menu.length)
				rodataWriter.writeInt32(binary.data.announcement.length)
				rodataWriter.writeInt32(binary.data.announcementExclude.length)
				
				updatedSections.set('.rodata', rodataWriter.toArrayBuffer())

				break
			}
			
			case DataType.DataBtl: {
				const dataPointers = new Map()
				objectRelocations.set('.data', dataPointers)
				
				const dataSymbols = new Map()
				symbolRelocations.set('.data', dataSymbols)
				
				// ----------------  data  ----------------
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: dataPointers,
					symbolRelocations: dataSymbols,
				}
				
				// model
				symbolLocationReference.set("wld::btl::data::s_modelBattle", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_modelBattle", (binary.data.model.length + 1) * FILE_TYPES[DataType.BtlModel].size)
				// TODO: use padding amount in all data types
				serializeObjects(data, DataType.BtlModel, binary.data.model, { padding: 1 })
				
				// parts
				symbolLocationReference.set("wld::btl::data::s_partsData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_partsData", (binary.data.part.length + 1) * FILE_TYPES[DataType.BtlPart].size)
				serializeObjects(data, DataType.BtlPart, binary.data.part, { padding: 1 })
				
				// unit (actor)
				symbolLocationReference.set("wld::btl::data::s_unitData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_unitData", (binary.data.unit.length + 1) * FILE_TYPES[DataType.BtlUnit].size)
				serializeObjects(data, DataType.BtlUnit, binary.data.unit, { padding: 1 })
				
				// weapon range
				for (const rangeHeader of binary.data.attackRangeHeader as Instance<DataType.BtlAttackRangeHeader>[]) {
					const { item: attackRange, symbolName } = rangeHeader.attackRange as {item: Instance<DataType.BtlAttackRange>, symbolName: string}
					
					let newSymbolName = "wld::btl::data::s_weaponRangeData_" + rangeHeader.id
					
					symbolLocationReference.set(symbolName, new Pointer(dataWriter.size))
					symbolSizeOverrides.set(symbolName, FILE_TYPES[DataType.BtlAttackRange].size)
					symbolNameOverrides.set(symbolName, newSymbolName)
					
					rangeHeader.attackRange.symbolName = newSymbolName
					
					serializeObjects(data, DataType.BtlAttackRange, [ attackRange ], { symbolWrapper: rangeHeader.attackRange })
				}
				
				// weapon range header
				symbolLocationReference.set("wld::btl::data::s_weaponRangeDataTable", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_weaponRangeDataTable", (binary.data.attackRangeHeader.length + 1) * FILE_TYPES[DataType.BtlAttackRangeHeader].size)
				serializeObjects(data, DataType.BtlAttackRangeHeader, binary.data.attackRangeHeader, { padding: 1 })
				
				// attacks
				symbolLocationReference.set("wld::btl::data::s_weaponData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_weaponData", (binary.data.attack.length + 1) * FILE_TYPES[DataType.BtlAttack].size)
				serializeObjects(data, DataType.BtlAttack, binary.data.attack, { padding: 1 })
				
				// event camera
				symbolLocationReference.set("wld::btl::data::s_eventCameraData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_eventCameraData", (binary.data.eventCamera.length + 1) * FILE_TYPES[DataType.BtlEventCamera].size)
				serializeObjects(data, DataType.BtlEventCamera, binary.data.eventCamera, { padding: 1 })
				
				// boss attacks (godhand)
				// no padding value
				symbolLocationReference.set("wld::btl::data::s_godHandData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_godHandData", binary.data.bossAttack.length * FILE_TYPES[DataType.BtlBossAttack].size)
				serializeObjects(data, DataType.BtlBossAttack, binary.data.bossAttack)
				
				// puzzle level
				symbolLocationReference.set("wld::btl::data::s_puzzleLevelData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_puzzleLevelData", (binary.data.puzzleLevel.length + 1) * FILE_TYPES[DataType.BtlPuzzleLevel].size)
				serializeObjects(data, DataType.BtlPuzzleLevel, binary.data.puzzleLevel, { padding: 1 })
				
				// cheer terms
				symbolLocationReference.set("wld::btl::data::s_cheerTermsData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_cheerTermsData", (binary.data.cheerTerm.length + 1) * FILE_TYPES[DataType.BtlCheerTerms].size)
				serializeObjects(data, DataType.BtlCheerTerms, binary.data.cheerTerm, { padding: 1 })
				
				// cheer
				symbolLocationReference.set("wld::btl::data::s_cheerData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_cheerData", (binary.data.cheer.length + 1) * FILE_TYPES[DataType.BtlCheer].size)
				serializeObjects(data, DataType.BtlCheer, binary.data.cheer, { padding: 1 })
				
				// resources
				for (const resourceField of binary.data.resourceField as Instance<DataType.BtlResourceField>[]) {
					const resources = resourceField.resources as {children: Instance<DataType.BtlResource>[], symbolName: string}
					const { children, symbolName } = resources
					
					let newSymbolName = "wld::btl::data::s_resourceElementData_" + resourceField.id
					
					symbolLocationReference.set(symbolName, new Pointer(dataWriter.size))
					symbolSizeOverrides.set(symbolName, children.length * FILE_TYPES[DataType.BtlResource].size)
					symbolNameOverrides.set(symbolName, newSymbolName)
					
					resources.symbolName = newSymbolName
					resourceField.resourceCount = children.length
					
					serializeObjects(data, DataType.BtlResource, children, { symbolWrapper: resources })
				}
				
				// resource fields/headers
				symbolLocationReference.set("wld::btl::data::s_resourceData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_resourceData", (binary.data.resourceField.length + 1) * FILE_TYPES[DataType.BtlResourceField].size)
				serializeObjects(data, DataType.BtlResourceField, binary.data.resourceField, { padding: 1 })
				
				// settings
				symbolLocationReference.set("wld::btl::data::s_configData", new Pointer(dataWriter.size))
				symbolSizeOverrides.set("wld::btl::data::s_configData", (binary.data.config.length + 1) * FILE_TYPES[DataType.BtlConfig].size)
				serializeObjects(data, DataType.BtlConfig, binary.data.config, { padding: 1 })
				
				
				// ----------------  rodata  ----------------
				// rodata model stuff
				let rodataReferences: RodataReference[] = binary.data.model.map(model => 
					[model.id, binary.modelSymbolReference.get(model), model.assetGroups, model.states])
					
				let rodata: SectionElements = {
					writer: new BinaryWriter(),
					stringRelocations: new Map(),
					crossPointers: new Map(),
				}
				
				stringRelocations.set('.rodata', rodata.stringRelocations)
				objectRelocations.set('.rodata', rodata.crossPointers)
				
				let serializedRodata = serializeModelRodata(rodataReferences, rodata, binary.data.model.length, "wld::btl::data")
				updatedSections.set('.rodata', serializedRodata)
				
				for (const npc of binary.data.model) {
					binary.modelSymbolReference.set(npc, npc.id)
				}
				
				break
			}
			
			default: {
				let data: SectionElements = {
					writer: dataWriter,
					stringRelocations: dataStringRelocations,
					crossPointers: undefined,
				}
				
				serializeObjects(data, dataType, binary.data.main)
				
				let isStandardDataFile = dataType >= DataType.DataNpc && dataType < DataType.DataNpcModel
				let isOtherSpecificDataFile = dataType == DataType.DataItemSet
						|| dataType == DataType.DataMaplinkZoom
						|| dataType == DataType.DataParty
				
				if (isStandardDataFile || isOtherSpecificDataFile) {
					serializeObjects(data, dataType, [FILE_TYPES[dataType].instantiate()])
				}
				
				break
			}
		}
		
		updatedSections.set('.data', dataWriter.toArrayBuffer())
		
		type RodataReference = [id: string, originalId: string, assetGroups: Instance<DataType.NpcFiles>[], states: Instance<DataType.NpcState>[]]
		
		function serializeModelRodata(rodataReferences: RodataReference[], rodata: SectionElements, modelNumber: number, modelNamespace: string) {
			const rodataWriter = rodata.writer
			
			// .rodata section is structured like this:
			
			// AssetGroup[]
			// State[]
			// ...
			// modelNpc_num (amount of objects in .data)
			// for each entry in .data:
			//   substate[]
			//   substate[]
			//     face[]
			//       anime[]
			//     face[]
			//       anime[]
			//       anime[]
			//       ...
			
			// the strings in .rodata are serialized in this order:
			// for each entry in .data
			//     AssetGroup, State, all animes connected to this state...
			
			// While it may seem unnnecessary to serialize the strings in exactly
			// the same order they were in originally, it is important to me that
			// the input file and unmodified output file are exactly equal, in order
			// to prevent bugs that would go unnoticed
			
			// step 1: Serialize Asset Groups, States and the strings from animes
			for (const [id, originalId, assetGroups, states] of rodataReferences) {
				serializeObjects(rodata, DataType.NpcFiles, assetGroups)
				serializeObjects(rodata, DataType.NpcFiles, [FILE_TYPES[DataType.NpcFiles].instantiate()])
				
				serializeObjects(rodata, DataType.NpcState, states)
				serializeObjects(rodata, DataType.NpcState, [FILE_TYPES[DataType.NpcState].instantiate()])
				
				let animes = (states as any[])
					.flatMap(state => state.substates)
					.flatMap(substate => substate.faces)
					.flatMap(face => face.animations)
				
				serializeStringsOnly(DataType.NpcAnime, animes)
			}
			
			// generate symbol reference for asset groups and states
			for (const [id, originalId, assetGroups, states] of rodataReferences) {
				let assetGroupOffset = assetGroups.length > 0 ? objectOffsets.get(assetGroups[0]) : objectOffsets.get(assetGroups)
				symbolLocationReference?.set(`${modelNamespace}::^${originalId}_model_files`, assetGroupOffset)
				symbolNameOverrides?.set(`${modelNamespace}::^${originalId}_model_files`, `${modelNamespace}::^${id}_model_files`)
				
				let stateOffset = states.length > 0 ? objectOffsets.get(states[0]) : objectOffsets.get(states)
				symbolLocationReference?.set(`${modelNamespace}::^${originalId}_state`, stateOffset)
				symbolNameOverrides?.set(`${modelNamespace}::^${originalId}_state`, `${modelNamespace}::^${id}_state`)
			}
			
			// step 2: serialize modelNpc_num
			symbolLocationReference?.set(FILE_TYPES[dataType].countSymbol, new Pointer(rodataWriter.size))
			rodataWriter.writeBigInt64(BigInt(modelNumber))
			
			// step 3: serialize substates, faces and animes
			for (const [id, originalId, assetGroups, states] of rodataReferences) {
				
				let animeCount = 0
				
				for (const [state, i] of enumerate(states)) {
					symbolLocationReference?.set(`${modelNamespace}::^${originalId}_state${i}`, new Pointer(rodataWriter.size))
					symbolNameOverrides?.set(`${modelNamespace}::^${originalId}_state${i}`, `${modelNamespace}::^${id}_state${i}`)
					
					serializeObjects(rodata, DataType.NpcSubState, state.substates)
					serializeObjects(rodata, DataType.NpcSubState, [FILE_TYPES[DataType.NpcSubState].instantiate()])
				}
				
				for (const [state, i] of enumerate(states)) {
					let { substates } = state
					
					for (const [substate, j] of enumerate(substates)) {
						let { faces } = substate as Instance<DataType.NpcSubState>
						
						symbolLocationReference?.set(`${modelNamespace}::^${originalId}_state${i}_face${j}`, new Pointer(rodataWriter.size))
						symbolNameOverrides?.set(`${modelNamespace}::^${originalId}_state${i}_face${j}`, `${modelNamespace}::^${id}_state${i}_face${j}`)
						
						serializeObjects(rodata, DataType.NpcFace, faces)
						serializeObjects(rodata, DataType.NpcFace, [FILE_TYPES[DataType.NpcFace].instantiate()])
					}
					
					for (const substate of substates) {
						let faces = substate.faces
						
						for (const face of faces) {
							let animes = face.animations
							
							symbolLocationReference?.set(`${modelNamespace}::^${originalId}_anime${animeCount}`, new Pointer(rodataWriter.size))
							symbolNameOverrides?.set(`${modelNamespace}::^${originalId}_anime${animeCount}`, `${modelNamespace}::^${id}_anime${animeCount}`)
							
							animeCount += 1
							
							serializeObjects(rodata, DataType.NpcAnime, animes)
							serializeObjects(rodata, DataType.NpcAnime, [FILE_TYPES[DataType.NpcAnime].instantiate()])
						}
					}
				}
			}
			
			return rodataWriter.toArrayBuffer()
		}
		
		interface SectionElements {
			writer: BinaryWriter
			stringRelocations: Map<number, string>
			crossPointers: Map<number, object>
			symbolRelocations?: Map<number, SymbolName>
		}
		
		interface SerializeObjectsProperties {
			padding?: number
			addStrings?: boolean
			symbolWrapper?: { symbolName: string, children?: any, item?: any }
		}
		
		/**
		 * Serializes an array of objects of a certain data type.
		 * @param param0 The section to be serialized into (e.g. data, rodata). Contains the BinaryWriter, string relocations and object relocations
		 * @param dataType 
		 * @param objects The objects to be serialized.
		 * @param paddingAmount If positive, it will append as many zero value instances as specified. If negative, it will remove objects at the end.
		 * @param addStrings If set to false, then the strings in the objects won't be added to the allStrings set.
		 */
		function serializeObjects(sectionElements: SectionElements, dataType: DataType, objects: object[], properties: SerializeObjectsProperties = {}) {
			const { writer, stringRelocations, crossPointers, symbolRelocations } = sectionElements
			const { padding: paddingAmount = 0, addStrings = true, symbolWrapper } = properties
			
			if (symbolWrapper)
				objectOffsets.set(symbolWrapper, new Pointer(writer.size))
			
			if (objects.length == 0 && !symbolWrapper) {
				objectOffsets.set(objects, new Pointer(writer.size))
			}
			
			if (paddingAmount > 0) {
				let padding = Array.from({ length: paddingAmount }, FILE_TYPES[dataType].instantiate)
				objects = [...objects, ...padding]
			}
			
			if (paddingAmount < 0) {
				objects = objects.slice(0, objects.length + paddingAmount)
			}
			
			for (const instance of objects) {
				objectOffsets.set(instance, new Pointer(writer.size))
				
				for (const [fieldName, fieldType] of Object.entries(FILE_TYPES[dataType].typedef)) {
					let fieldValue = instance[fieldName]
					
					switch (fieldType) {
						case "string": 
							if (addStrings)
								allStrings.add(fieldValue)
							
							if (fieldValue != null)
								stringRelocations.set(writer.size, fieldValue)
							
							writer.writeBigInt64(0n)
							break
						case "symbol": 
							if (fieldValue != null)
								symbolRelocations.set(writer.size, fieldValue.symbolName)
							
							writer.writeBigInt64(0n)
							break
						case "pointer":
							// empty arrays are null as well
							if (!Pointer.NULL.equals(fieldValue) && fieldValue != null) {
								crossPointers.set(writer.size, fieldValue)
							}
						
							writer.writeBigInt64(0n)
							break
						case "Vector3": 
							writer.writeFloat32(fieldValue.x)
							writer.writeFloat32(fieldValue.y)
							writer.writeFloat32(fieldValue.z)
							break
						case "float": 
							writer.writeFloat32(fieldValue)
							break
						case "double": 
							writer.writeFloat64(fieldValue)
							break
						case "byte": 
							writer.writeUint8(fieldValue)
							break
						case "bool8": 
							writer.writeUint8(fieldValue ? 1 : 0)
							break
						case "bool32": 
							writer.writeUint32(fieldValue ? 1 : 0)
							break
						case "short": 
							writer.writeInt16(fieldValue)
							break
						case "int": 
							writer.writeInt32(fieldValue)
							break
						case "long": 
							writer.writeBigInt64(BigInt(fieldValue))
							break
							
						default:
							throw new Error(`Unknown data type ${fieldType}`)
					}
				}
			}
		}
		
		function serializeStringsOnly(dataType: DataType, objects: object[]) {
			for (const instance of objects) {
				for (const [fieldName, fieldType] of Object.entries(FILE_TYPES[dataType].typedef)) {
					if (fieldType === "string") {
						allStrings.add(instance[fieldName])
					}
				}
			}
		}
	}
	
	// The .rodata section always contains the amount of items in .data as a 32-bit integer.
	// In most of the file formats, this is it, the section is just 4 bytes in size.
	// However, there are a few file formats that contain secondary data. This means that
	// .rodata additionally contains a lot of independent structs or struct arrays similar to
	// a heap.
	// One example are the data_model files, which function this way, and where most of the
	// information is actually stored in this section.
	// For these file formats, the data and rodata sections are so deeply linked that it is generated
	// in the .data section above instead.
	
	// There are also file types like data_btl_set and data_item_set, which don't
	// have a .rodata section at all. We do not have to make a special case for these,
	// as the entry in updatedSections will just be ignored if there is no .rodata section present.
	
	if (!updatedSections.has('.rodata')) {
		let writer = new BinaryWriter()
		
		switch (dataType) {
			case DataType.None:
				writer.writeInt32(0)
				break
			
			// case DataType.DataNpcModel:
				
			default:
				writer.writeInt32(binary.data.main.length)
		}
		
		updatedSections.set('.rodata', writer.toArrayBuffer())
	}
	
	// The .rodata.str1.1 section maybe sounds like it's similar to .rodata, 
	// but in terms of content, it's not. It contains all of the strings in the content sections
	// (as opposed to .strtab, which contains ELF format related strings).
	// Because we collected the strings earlier into the allStrings set, we can now serialize
	// all of them.
	// However, we need to store where the strings are located, so they can be linked to
	// in the .rela* sections.
	
	const stringLocations: Map<string, Pointer> = new Map()
	
	{
		let writer = new BinaryWriter()
		
		for (const str of allStrings) {
			if (str != null) {
				stringLocations.set(str, new Pointer(writer.size))
				writer.writeString(str)
			}
		}
		
		updatedSections.set('.rodata.str1.1', writer.toArrayBuffer())
	}
	
	
	// In Maplink files, symbol 9 always points to the beginning of the Maplink Header
	// TODO: use symbolLocationReference in the main data serializer above instead
	if (dataType == DataType.Maplink) {
		const dataSection = updatedSections.get('.data')
		
		const maplinkSymbol = binary.symbolTable[9]
		const maplinkHeaderSize = FILE_TYPES[DataType.MaplinkHeader].size
		
		maplinkSymbol.location = new Pointer(dataSection.byteLength - maplinkHeaderSize)
	}
	
	
	// @ts-ignore
	const sections = binary.sections
	
	
	// In many file formats, the Symbol Table contains references to the content of the files.
	// This means that for these data types, it has to be modified and serialized again.
	
	// The symbol table is very straight forward. It's an array of `Symbol`s. However, the
	// first element is always completely zero.
	{
		let unusedLocationEntries = new Set(symbolLocationReference.keys())
		let unusedNameEntries = new Set(symbolNameOverrides.keys())
		let unusedSizeEntries = new Set(symbolSizeOverrides.keys())
		
		const stringTable = findSection(".strtab")
		
		let writer = new BinaryWriter()
		
		for (const symbol of binary.symbolTable) {
			let symbolId = demangle(symbol.name)
			
			if (symbolLocationReference.has(symbolId)) {
				symbol.location = symbolLocationReference.get(symbolId)
				unusedLocationEntries.delete(symbolId)
			}
			
			if (symbolNameOverrides?.has(symbolId)) {
				let newId = symbolNameOverrides.get(symbolId)
				unusedNameEntries.delete(symbolId)
				
				if (symbolId != newId) {
					console.warn(`Updating name of Symbol ${JSON.stringify(symbolId)} to ${JSON.stringify(newId)}`)
				}
				
				symbol.name = mangleIdentifier(newId)
			}
			
			if (symbolSizeOverrides.has(symbolId)) {
				symbol.size = symbolSizeOverrides.get(symbolId)
				unusedSizeEntries.delete(symbolId)
			}
			
			symbol.toBinaryWriter(writer, stringTable)
		}
		
		if (unusedLocationEntries.size > 0)
			console.error("Unused location entries:", [...unusedLocationEntries.values()])
		
		if (unusedNameEntries.size > 0)
			console.error("Unused name entries:", [...unusedNameEntries.values()])
		
		if (unusedSizeEntries.size > 0)
			console.error("Unused size entries:", [...unusedSizeEntries.values()])
		
		updatedSections.set('.symtab', writer.toArrayBuffer())
	}
	
	
	// The .rela* sections all have the purose of having pointers inside other sections.
	// Because simply embedding the pointers in the sections themselves could only carry
	// the address of the target, which wouldn't be enough information (to which symbol
	// or section does it point?), the relocations are offloaded entirely.
	// This is where the .rela* sections come in. Examples include .rela.data and .rela.rodata.
	// They contain all information necessary for relocating, such as the location where
	// the relocation should be applied to, the offset of the target and the symbol
	// where it points to.
	
	// Because most, if not all of the relocations so far were abstract relocations
	// towards strings and not addresses, we have to convert them to proper relocations first.
	const DEFAULT_RELOCATION_TYPE = 0x101
	
	{
		// string relocations
		const stringSectionIndex = sections.findIndex(section => section.name === ".rodata.str1.1")
		const stringSectionSymbolIndex = binary.symbolTable.findIndex(symbol => symbol.info == 3
			&& symbol.sectionHeaderIndex == stringSectionIndex)
		
		for (const [sectionName, sectionStringRelocations] of stringRelocations) {
			if (!allRelocations.has(sectionName))
				allRelocations.set(sectionName, [])
			
			let rawRelocations: Relocation[] = allRelocations.get(sectionName)
			
			for (const [location, str] of sectionStringRelocations) {
				let targetLocation = stringLocations.get(str)
				
				if (targetLocation != Pointer.NULL)
					rawRelocations.push(new Relocation(new Pointer(location), DEFAULT_RELOCATION_TYPE, stringSectionSymbolIndex, targetLocation))
			}
		}
	}
	
	{
		// pointer relocations
		let destinationSection = dataType === DataType.DataUi ? ".data" : ".rodata"
		let destinationSectionIndex = sections.findIndex(section => section.name === destinationSection)
		let sectionSymbolIndex = binary.symbolTable.findIndex(symbol => symbol.info == 3 && symbol.sectionHeaderIndex == destinationSectionIndex)
		
		for (const [sectionName, sectionObjectRelocations] of objectRelocations) {
			if (!allRelocations.has(sectionName))
				allRelocations.set(sectionName, [])
			
			let rawRelocations: Relocation[] = allRelocations.get(sectionName)
			
			for (const [location, target] of sectionObjectRelocations) {
				let targetLocation = objectOffsets.get(target instanceof Array && target.length > 0 ? target[0] : target)
				
				if (!targetLocation)
					console.warn("No offset entry for object", target)
				
				if (targetLocation != Pointer.NULL && targetLocation != undefined)
					rawRelocations.push(new Relocation(new Pointer(location), DEFAULT_RELOCATION_TYPE, sectionSymbolIndex, targetLocation))
			}
		}
	}
	
	{
		// symbol relocations
		if (dataType != DataType.DataBtlSet) {
			for (const [sectionName, sectionSymbolRelocations] of symbolRelocations) {
				if (!allRelocations.has(sectionName))
					allRelocations.set(sectionName, [])
				
				let rawRelocations: Relocation[] = allRelocations.get(sectionName)
				
				for (const [location, targetSymbol] of sectionSymbolRelocations) {
					let targetSymbolIndex = binary.symbolTable.findIndex(symbol => demangle(symbol.name) === targetSymbol)
					rawRelocations.push(new Relocation(new Pointer(location), DEFAULT_RELOCATION_TYPE, targetSymbolIndex, Pointer.ZERO))
				}
			}
		}
	}
	
	// Maplink files always have a relocation for field_0x20 in the header to symbol 8
	// TODO: move this to the maplink serializer
	if (dataType == DataType.Maplink) {
		let headerSize = FILE_TYPES[DataType.MaplinkHeader].size
		
		let offset = updatedSections.get('.data').byteLength - headerSize + 0x10
		
		allRelocations.get('.data').push(new Relocation(new Pointer(offset), 0x101, 0x8, Pointer.ZERO))
	}
	
	
	// Because relocations are always ordered sequentially by their location, 
	// they have to be sorted first, but then they can finally be serialized
	for (const [sectionName, sectionRelocations] of allRelocations) {
		let writer = new BinaryWriter()
		
		sectionRelocations.sort((a, b) => a.locationOffset.value - b.locationOffset.value)
		
		for (const relocation of sectionRelocations) {
			// console.log('relocation', relocation.locationOffset.toBigInt().toString(16), relocation.targetOffset.toBigInt().toString(16))
			relocation.toBinaryWriter(writer)
		}
		
		updatedSections.set('.rela' + sectionName, writer.toArrayBuffer())
	}
	
	console.log('allRelocations', allRelocations)
	
	
	
	// Now that all of the sections have been updated, the file needs to be reassembled.
	// For more precise information on the structure of an ELF file, see `parseElfFile`.
	
	const writer = new BinaryWriter()
	
	function alignWithPadding(writer: BinaryWriter, byteAlignment: number) {
		writer.writeUint8Array(new Array((byteAlignment - writer.size % byteAlignment) % byteAlignment).fill(0))
	}
	
	writer.writeArrayBuffer(BINARY_HEADER)
	
	
	// Sort sections by offset
	const offsetSortedSections = [...sections]
	offsetSortedSections.sort((a, b) => a.offset - b.offset)
	
	// Serialize sections
	for (const section of offsetSortedSections) {
		if (section.addrAlign > 0) {
			alignWithPadding(writer, section.addrAlign)
		}
		
		if (section.type != 0 && section.size != 0) {
			section.offset = writer.size
		}
		
		if (updatedSections.has(section.name)) {
			let buffer = updatedSections.get(section.name)
			section.content = buffer
			section.size = buffer.byteLength
		}
		
		writer.writeArrayBuffer(section.content)
	}
	
	// Write section header table
	alignWithPadding(writer, 8)

	const sectionHeaderTableLocation = writer.size
	
	for (const section of sections) {
		if (section.name == ".rela.data") {
			console.log(section.name, section.offset.toString(16))
		}
		
		section.writeHeaderToBinaryWriter(writer)
	}
	
	
	
	const output = writer.toArrayBuffer()
	
	// update section header pointer
	let dataView = new DataView(output)
	dataView.setBigInt64(0x28, BigInt(sectionHeaderTableLocation), true)
	dataView.setInt16(0x3C, sections.length, true)
	
	
	
	return output
}