import type { DataType } from "$lib/elf/elfBinary";
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

