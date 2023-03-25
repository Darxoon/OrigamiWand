import { DataType, ElfBinary } from "./elfBinary"
import { FILE_TYPES } from "./fileTypes"
import { demangle, incrementName, mangleIdentifier } from "./nameMangling"
import { ValueUuid, VALUE_UUID } from "./valueIdentifier"

export function* enumerate<T>(arr: T[]): Generator<[T, number], void, unknown> {
	for (let i = 0; i < arr.length; i++) {
		yield [arr[i], i]
	}
}

export function duplicateObjectInBinary<T extends object>(binary: ElfBinary, dataType: DataType, containingArray: T[], obj: T, incrementId: boolean = true): T {
	function cloneObject<T>(dataType: DataType, obj: T): T {
		// deep clone self
		let clone = {...obj}
		Object.setPrototypeOf(clone, Object.getPrototypeOf(obj))
		
		clone[VALUE_UUID] = ValueUuid()
		
		if (incrementId && FILE_TYPES[dataType].identifyingField == "id") {
			// @ts-ignore
			clone.id = incrementName(obj.id)
		}
		
		// deep clone children
		for (const [fieldName, fieldValue] of Object.entries(obj) as [string, unknown][]) {
			const fieldType = FILE_TYPES[dataType].typedef[fieldName]
			
			if (fieldType === "pointer" && fieldValue != null) {
				const childDataType = FILE_TYPES[dataType].childTypes[fieldName]
				const childObjectType = FILE_TYPES[childDataType].objectType
				
				let clonedChild = duplicateObjectInBinary(binary, childDataType, binary.data[childObjectType], fieldValue as object, false)
				clone[fieldName] = clonedChild
			}
			
			if (fieldType === "symbol" && fieldValue != null) {
				const childDataType = FILE_TYPES[dataType].childTypes[fieldName]
				const childObjectType = FILE_TYPES[childDataType].objectType
				
				if (!binary.data[childObjectType].includes(fieldValue)) {
					throw new Error("Cannot clone object " + fieldValue + " because it doesn't exist in the binary")
				}
				
				if (typeof fieldValue != "object" || !("symbolName" in fieldValue) || typeof fieldValue.symbolName != "string") {
					throw new Error("Cannot clone object " + fieldValue + " because it's of an invalid type")
				}
				
				let clonedChild = duplicateObjectInBinary<object & Record<"symbolName", unknown>>(binary, 
					childDataType, binary.data[childObjectType], fieldValue, false)
				
				// also duplicate symbol
				let originalSymbol = binary.findSymbol(fieldValue.symbolName)
				let clonedSymbol = originalSymbol.clone()
				
				// the new symbol is given a (probably) unique name to prevent symbol name collisions, which are the root of all evil
				let clonedSymbolName = incrementName(demangle(originalSymbol.name)) + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
				clonedSymbol.name = mangleIdentifier(clonedSymbolName)
				
				// insert new symbol into symboltable
				let originalSymbolIndex = binary.symbolTable.indexOf(originalSymbol)
				binary.symbolTable.splice(originalSymbolIndex + 1, 0, clonedSymbol)
				
				clone[fieldName] = clonedChild
				clonedChild.symbolName = clonedSymbolName
			}
		}
		
		return clone
	}
	
	function cloneArray<T>(dataType: DataType, arr: T[]): T[] {
		let result = arr.map(obj => cloneObject(dataType, obj))
		console.log(result)
		return result
	}
	
	console.log('cloning', DataType[dataType], obj)
	let clone = obj instanceof Array
		? cloneArray(dataType, obj) as unknown as T
		: 'item' in obj
		? {...obj, item: cloneObject(dataType, obj.item)}
		: 'children' in obj
		? {...obj, children: cloneArray(dataType, obj.children as any[])}
		: cloneObject(dataType, obj)
			
	
	// insert clone into array
	let objectIndex = containingArray.indexOf(obj)
	containingArray.splice(objectIndex + 1, 0, clone)
	
	return clone
}
