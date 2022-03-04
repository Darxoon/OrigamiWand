import BoyerMoore from "./boyermoore"
import { Pointer } from "./elfBinary"
import { BinaryReader, BinaryWriter } from "./misc"

/**
 * Sections are a fundamental part of ELF binaries.
 * They each have a name and a content, which is an arbitrary data block.
 * Every section has a unique purpose, but most of these depend on the purpose of the binary.
 * 
 * Examples include: `.text` (contains assembly instructions), `.data` (data specific to the indidual file),
 *                   `.symtab` (symbol table), among others
 */
export class Section {
	namePointer: Pointer
	name: string
	type: number
	flags: number
	addr: number
	offset: number
	size: number
	link: number
	info: number
	addrAlign: number
	entSize: number
	
	content: ArrayBuffer
	
	constructor(reader: BinaryReader) {
		this.namePointer = new Pointer(reader.readInt32())
        this.name = null
		this.type = reader.readInt32()
		this.flags = Number(reader.readBigInt64())
		this.addr = Number(reader.readBigInt64())
		this.offset = Number(reader.readBigInt64())
		this.size = Number(reader.readBigInt64())
		this.link = reader.readInt32()
		this.info = reader.readInt32()
		this.addrAlign = Number(reader.readBigInt64())
		this.entSize = Number(reader.readBigInt64())

		this.content = null
	}
	
	getStringAt(offset: Pointer): string {
		if (offset == Pointer.NULL)
			return null
		
		const view = new DataView(this.content)
			
		// find zero terminator
		let endPosition = offset.value
		while (view.getUint8(endPosition) != 0)
			endPosition += 1
			
		return new TextDecoder('utf-8').decode(this.content.slice(offset.value, endPosition))
	}
	
	writeHeaderToBinaryWriter(writer: BinaryWriter) {
		writer.writeInt32(this.namePointer.value)
		writer.writeUint32(this.type)
		writer.writeBigInt64(BigInt(this.flags))
		writer.writeBigInt64(BigInt(this.addr))
		writer.writeBigInt64(BigInt(this.offset))
		writer.writeBigInt64(BigInt(this.size))
		writer.writeInt32(this.link)
		writer.writeInt32(this.info)
		writer.writeBigInt64(BigInt(this.addrAlign))
		writer.writeBigInt64(BigInt(this.entSize))
		
		let writer2 = new BinaryWriter()
		writer2.writeUint32(this.type)
		return new Uint8Array(writer2.toArrayBuffer())
	}
	
	appendString(str: string): void {
		let writer = new BinaryWriter(true, this.content)
		writer.writeString(str, true)
		this.content = writer.toArrayBuffer()
		this.size = this.content.byteLength
	}
}

export class Relocation {
	locationOffset: Pointer
	infoLow: number
	infoHigh: number
	targetOffset: Pointer
	
	constructor(locationOffset: Pointer, infoLow: number, infoHigh: number, targetOffset: Pointer) {
		this.locationOffset = locationOffset
		this.infoLow = infoLow
		this.infoHigh = infoHigh
		this.targetOffset = targetOffset
	}
	
	static fromBinaryReader(reader: BinaryReader) {
		return new Relocation(
			new Pointer(Number(reader.readBigInt64())), 
			reader.readInt32(), 
			reader.readInt32(), 
			new Pointer(Number(reader.readBigInt64()))
		)
	}
	
	toBinaryWriter(writer: BinaryWriter) {
		writer.writeBigInt64(this.locationOffset.toBigInt())
		writer.writeInt32(this.infoLow)
		writer.writeInt32(this.infoHigh)
		writer.writeBigInt64(this.targetOffset.toBigInt())
	}
}

export class Symbol {
	name: string
	info: number
	visibility: number
	sectionHeaderIndex: number
	location: Pointer
	size: number
	
	constructor(reader: BinaryReader, stringSection: Section) {		
		let namePointer = new Pointer(reader.readInt32())
		
		this.name = stringSection.getStringAt(namePointer)
		this.info = reader.readUint8()
		this.visibility = reader.readUint8()
		this.sectionHeaderIndex = reader.readInt16()
		this.location = new Pointer(Number(reader.readBigInt64()))
		this.size = Number(reader.readBigInt64())
	}
	
	toBinaryWriter(writer: BinaryWriter, stringTable: Section) {
		let nameOffset: number = 0
		
		if (this.name != "") {
			let search = new BoyerMoore(new TextEncoder().encode(this.name))
			nameOffset = search.findIndex(stringTable.content)
		}
		
		if (nameOffset == -1) {
			nameOffset = stringTable.content.byteLength
			stringTable.appendString(this.name)
		}
		
		writer.writeInt32(nameOffset)
		writer.writeUint8(this.info)
		writer.writeUint8(this.visibility)
		writer.writeInt16(this.sectionHeaderIndex)
		writer.writeBigInt64(this.location.toBigInt())
		writer.writeBigInt64(BigInt(this.size))
	}
	
	clone(): Symbol {
		let clone = {...this}
		Object.setPrototypeOf(clone, Object.getPrototypeOf(this))
		return clone
	}
}
