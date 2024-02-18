import type { DataType } from "paper-mario-elfs/dataType";
import { writable } from "svelte/store";

export const hexFields = writable({})

export function setHexField(dataType: DataType, fieldName: string, viewAsHex: boolean) {
	hexFields.update(hexFields => {
		if (!hexFields.hasOwnProperty(dataType))
			hexFields[dataType] = {}
		return hexFields
	})
	
	hexFields.update(hexFields => {
		hexFields[dataType][fieldName] = viewAsHex
		return hexFields
	})
}

