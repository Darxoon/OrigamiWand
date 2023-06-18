import type { DataType } from "./elfBinary"

export const VALUE_UUID = Symbol("VALUE_UUID")
export const DATA_TYPE = Symbol("DATA_TYPE")

export type ValueUuid = Symbol

export interface UuidTagged {
	[VALUE_UUID]: ValueUuid
	[DATA_TYPE]: DataType
}

export function ValueUuid() {
	return Symbol()
}
