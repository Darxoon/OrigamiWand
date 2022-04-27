import { DataType, ElfBinary } from "./elfBinary"
import { FILE_TYPES } from "./fileTypes"

export function* enumerate<T>(arr: T[]): Generator<[T, number], void, unknown> {
	for (let i = 0; i < arr.length; i++) {
		yield [arr[i], i]
	}
}

export function duplicateElfObject<T>(binary: ElfBinary, dataType: DataType, containingArray: T[], obj: T, isRootObject: boolean = true): T {
	function cloneObject<T>(dataType: DataType, obj: T): T {
		// deep clone self
		let clone = {...obj}
		Object.setPrototypeOf(clone, Object.getPrototypeOf(obj))
		
		if (isRootObject && FILE_TYPES[dataType].identifyingField == "id") {
			// @ts-ignore
			clone.id = incrementName(obj.id)
		}
		
		// deep clone children
		for (const [fieldName, fieldValue] of Object.entries(obj)) {
			const fieldType = FILE_TYPES[dataType].typedef[fieldName]
			
			if (fieldType === "pointer") {
				const childDataType = FILE_TYPES[dataType].childTypes[fieldName]
				let childObjectType = FILE_TYPES[childDataType].objectType
				
				let clonedChild = duplicateElfObject(binary, childDataType, binary.data.get(childObjectType), fieldValue, false)
				clone[fieldName] = clonedChild
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
	let clone = obj instanceof Array ? cloneArray(dataType, obj) as unknown as T : cloneObject(dataType, obj)
	
	// insert clone into array
	let objectIndex = containingArray.indexOf(obj)
	containingArray.splice(objectIndex + 1, 0, clone)
	containingArray = containingArray
	
	return clone
}
