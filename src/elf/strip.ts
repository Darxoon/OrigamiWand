import type { ElfBinary } from "./elfBinary";

export interface StripBinaryOptions {
	comment?: string
}

/**
 * Strips a binary of irrelevant sections and replaces Clang comment with custom one
 * @param binary The binary to strip
 */
export default function stripBinary(binary: ElfBinary, options?: StripBinaryOptions) {
	// create references of what sections the section header indices refer to
	// because the indices will become incorrect when the sections are being rearranged
	let symbolIndices = new Map(binary.symbolTable.map(sym => [sym, binary.sections[sym.sectionHeaderIndex]?.name]))
	let sectionLinks = new Map(binary.sections.map(section => [section, binary.sections[section.link]?.name]))

	// remove unneccessary sections
	binary.sections = binary.sections.filter(section => 
		![".text", ".note.GNU-stack", ".llvm_addrsig"].includes(section.name) && !(options?.comment == undefined && section.name == ".comment")
	)

	// correct section header indices
	for (const sym of binary.symbolTable) {
		if (symbolIndices.get(sym)) {
			let targetSectionName = symbolIndices.get(sym)
			let targetSectionIndex = binary.sections.findIndex(s => s.name == targetSectionName)
			sym.sectionHeaderIndex = targetSectionIndex
		}
	}
	
	for (const section of binary.sections) {
		if (sectionLinks.get(section)) {
			let targetSectionName = sectionLinks.get(section)
			let targetSectionIndex = binary.sections.findIndex(s => s.name == targetSectionName)
			section.link = targetSectionIndex
		}
	}
	
	// modify .comment section
	if (options?.comment != undefined) {
		let commentString = '\0' + options.comment + '\0'
		
		let encoder = new TextEncoder()
		let newCommentBuffer = encoder.encode(commentString).buffer
		
		let commentSection = binary.findSection('.comment')
		commentSection.content = newCommentBuffer
		commentSection.size = newCommentBuffer.byteLength
	}
}
