export const VALUE_UUID = Symbol("VALUE_UUID")

export type ValueUuid = Symbol

export interface UuidTagged {
	[VALUE_UUID]: ValueUuid
}

export function ValueUuid() {
	return Symbol()
}