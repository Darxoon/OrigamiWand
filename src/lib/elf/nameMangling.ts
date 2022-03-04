
/**
 * Mangles a valid C++ Identifier according to Clang's name mangling rules.
 * @example "wld::fld::data::s_npcData" will be transformed into "_ZN3wld3fld4data9s_npcDataE"
 * @param id The identifier to mangle. Segments are seperated by ::
 */
export function mangleIdentifier(id: string): string {
	if (id.includes(' '))
		throw new Error(`Input Identifier \`${id}\` is not allowed to contain any spaces.`)
	
	let segments = id.split('::')
	let output = "_ZN"
	
	for (const segment of segments) {
		if (segment.startsWith(':'))
			output += 'L'
		
		let segmentId = segment.startsWith(':') ? segment.slice(1) : segment
		output += segmentId.length.toString() + segmentId
	}
	
	return output + 'E'
}

export function followsManglingRules(id: string): boolean {
	return id != undefined && id.startsWith('_ZN') && id.endsWith('E') && !id.includes(' ')
}

/**
 * Demangles an Identifier following Clang's name mangling rules back to an almost valid C++ identifier
 * The only exception is that for example, _ZN3wld3fld4dataL18ModelID_Bone_stateE will get converted into
 * wld::fld::data:::ModelID_Bone_state (notice the L in the original and ::: in the demangled version).
 * @param mangledId The mangled identifier following Clang's name mangling rules
 * @returns The demangled identifier. Segments are seperated by ::
 * @example "_ZN3wld3fld4data9s_npcDataE" will be transformed into "wld::fld::data::s_npcData"
 */
export function demangle(mangledId: string): string {
	if (!followsManglingRules(mangledId))
		return mangledId
	
	let id = mangledId.slice('_ZN'.length, -1)
	let segments = []
	
	let segmentIndex = 0
	
	
	while (segmentIndex < id.length) {
		let prefix = id[segmentIndex] === 'L' ? ":" : ""
		
		if (id[segmentIndex] === 'L') {
			segmentIndex += 1
		}
		
		// console.log(mangledId, id, segmentIndex, id[segmentIndex])
		let [ lengthStr ] = id.slice(segmentIndex).match(/^\d+/)
		let segmentStart = segmentIndex + lengthStr.length
		let segment = prefix + id.slice(segmentStart, segmentStart + parseInt(lengthStr))
		segments.push(segment)
		segmentIndex += lengthStr.length + segment.length
	}
	
	return segments.join('::')
}

function isDigit(char: string) {
	return /^\d$/.test(char)
}

export function incrementName(name: string, isRoot: boolean = true): string {
	if (!isDigit(name[name.length - 1])) {
		return isRoot ? name + "2" : name + "1"
	}

	let lastDigit = parseInt(name[name.length - 1])
	
	if (lastDigit == 9) {
		return incrementName(name.slice(0, -1), false) + "0"
	} else {
		return name.slice(0, -1) + (lastDigit + 1)
	}
}
