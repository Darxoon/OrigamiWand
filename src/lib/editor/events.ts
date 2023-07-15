import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
import type { UuidTagged } from "paper-mario-elfs/valueIdentifier";
import { SvelteComponent } from "svelte";

export class OpenWindowEvent {
	title: string
	dataType: DataType
	binary: ElfBinary
	overrideObjects: UuidTagged[]
	component?: SvelteComponent
	
	constructor(title: string, dataType: DataType, binary: ElfBinary, overrideObjects?: UuidTagged[], component?: SvelteComponent)
	constructor(title: string, dataType: DataType, binary: ElfBinary, component?: SvelteComponent)
	
	constructor(title: string, dataType: DataType, binary: ElfBinary, a?: UuidTagged[] | SvelteComponent, b?: SvelteComponent) {
		if (a != undefined && !(a instanceof Array || a instanceof SvelteComponent))
			throw new TypeError("Argument overrideObjects/component must be an array or component constructor.")
		
		if (b != undefined && !(b instanceof SvelteComponent))
			throw new TypeError("Argument component must be a component constructor.")
		
		this.title = title
		this.dataType = dataType
		this.binary = binary
		
		if (a instanceof Array)
			this.overrideObjects = a
		
		if (a instanceof SvelteComponent)
			this.component = a
		
		else if (b instanceof SvelteComponent)
			this.component = b
	}
}