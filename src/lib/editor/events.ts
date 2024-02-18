import type { DataType } from "paper-mario-elfs/dataType";
import type { UuidTagged } from "paper-mario-elfs/valueIdentifier";
import { SvelteComponent } from "svelte";
import type { Tab } from "./globalDragging";

export class OpenWindowEvent {
	title: string
	dataType: DataType
	overrideObjects: UuidTagged[]
	component?: SvelteComponent
	
	/**
	 * Meant to be set by the EditorWindow where the event inevitably goes through.
	 */
	parentTab?: Tab
	
	constructor(title: string, dataType: DataType, overrideObjects?: UuidTagged[], component?: SvelteComponent)
	constructor(title: string, dataType: DataType, component?: SvelteComponent)
	
	constructor(title: string, dataType: DataType, a?: UuidTagged[] | SvelteComponent, b?: SvelteComponent) {
		if (a != undefined && !(a instanceof Array || a instanceof SvelteComponent))
			throw new TypeError("Argument overrideObjects/component must be an array or component constructor.")
		
		if (b != undefined && !(b instanceof SvelteComponent))
			throw new TypeError("Argument component must be a component constructor.")
		
		this.title = title
		this.dataType = dataType
		
		if (a instanceof Array)
			this.overrideObjects = a
		
		if (a instanceof SvelteComponent)
			this.component = a
		
		else if (b instanceof SvelteComponent)
			this.component = b
	}
}