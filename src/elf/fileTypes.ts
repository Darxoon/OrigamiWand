import { dataDivisions, DataType, ElfBinary, Pointer, type DataDivision } from "./elfBinary";
import { Vector3 } from "./misc";
import { ValueUuid, VALUE_UUID } from "./valueIdentifier";

export type Typedef<T> = {[fieldName: string]: T}

const scriptDisclaimer = "To find the function's location, you can use \
[all_functions.json](https://gist.github.com/Darxoon/16bb8777d7f2f8dbef0f2516b8ddce65)."

export interface PropertyOptions {
	hidden?: boolean
	tabName?: string
	noSpaces?: boolean
}

export type PropertyType = "string" | "symbol" | "pointer" | "Vector3" | "float"
	| "double" | "byte" | "bool8" | "bool32" | "short" | "int" | "long"

export class Property<T extends PropertyType> {
	type: T
	description?: string
	hidden: boolean
	tabName?: string
	noSpaces: boolean
	
	constructor(type: T, description?: string, options?: PropertyOptions) {
		this.type = type
		this.description = description
		this.hidden = options?.hidden ?? false
		this.tabName = options?.tabName
		this.noSpaces = options?.noSpaces ?? false
	}
}


// TODO: factor out into unique file
type RawTypedef<T extends number> = (typeof typedefs)[T]

type StrToType<T> = 
	T extends "string" ? string
	: T extends "symbol" ? any
	: T extends "pointer" ? any
	: T extends "Vector3" ? Vector3
	
	: T extends "float" ? number
	: T extends "double" ? number
	: T extends "long" ? number
	: T extends "int" ? number
	: T extends "short" ? number
	: T extends "byte" ? number
	
	: T extends "bool8" ? boolean
	: T extends "bool32" ? boolean
	
	: never

type UnfilteredInstance<T extends number> = {
	-readonly [p in keyof RawTypedef<T>]: StrToType<RawTypedef<T>[p] extends Property<infer U> ? U : RawTypedef<T>[p]>
}

export type Instance<T extends number> = Pick<
	UnfilteredInstance<T>, 
	{[p in keyof UnfilteredInstance<T>]: UnfilteredInstance<T>[p] extends never ? never : p}[keyof UnfilteredInstance<T>]
>

const defaultDescriptions: Typedef<string> = {
	stage: "The stage that the {type} is on. It's the same for every {type} in the same file.",
	id: "The unique ID of the {type}, which can be used to identify it.",
	type: "The type of the {type}, which is a reference to data_{type_lowercase}.elf.",
	rotationDegrees: "The rotation in degrees around the {type}'s Y axis.",
	rotation: "The rotation euler angles in degrees. The X coordinate is the rotation in degrees around the {type}'s X axis, etc.",
	assetGroups: `
A list of all asset groups of this Model. 
An Asset Group is a group of related files all sharing the same name and directory
but having different file extensions.`,
	states: `
A list of all states. What a 'state' is and the difference between states and sub states 
are currently not known with certainty.`,
	
}

const modelDataType = {
	id: "string",
	field_0x8: new Property("Vector3", "Usage unknown, but one guess would be scale? Please verify."),
	field_0x14: "short",
	field_0x16: "short",
	field_0x18: "short",
	field_0x1A: "short",
	field_0x1c: "int",
	field_0x20: "int",
	field_0x24: "int",
	field_0x28: "int",
	field_0x2c: "int",
	field_0x30: "int",
	field_0x34: "int",
	field_0x38: "float",
	field_0x3c: "float",
	field_0x40: "float",
	field_0x44: "int",
	field_0x48: "int",
	field_0x4c: "int",
	field_0x50: "int",
	field_0x54: "float",
	field_0x58: "float",
	field_0x5c: "float",
	field_0x60: "float",
	field_0x64: "float",
	field_0x68: "int",
	field_0x6c: "int",
	// internally also called "files"
	// was changed because refering to single objects with plural names was confusing 
	assetGroups: new Property("pointer", undefined, {
		tabName: "Asset Groups for {type} {id}"
	}),
	assetGroupCount: new Property("int", undefined, {hidden: true}),
	field_0x7c: "int",
	states: new Property("pointer", undefined, {
		tabName: "States for {type} {id}",
	}),
	stateCount: new Property("int", undefined, {hidden: true}),
	field_0x8c: "int",
}

const typedefs = {
	[DataType.Npc]: {
		__displayName: "NPC",
		
		stage: new Property("string", `
{standard}

Examples: W1G1_HouseA, W1G3_Observatory`),
		id: "string",
		type: new Property("string", "{standard}\n\nExamples: O_KUR, P_NOK"),
		position: "Vector3",
		rotationDegrees: "float",
		isInvisibleOnLoad: "bool8",
		isEnemy: new Property("bool8", "If this is set to true, the NPC will chase you and initiate a battle on touch"),
		field_0x2a: "byte",
		field_0x2b: "byte",
		field_0x2c: "int",
		enemyEncounterId: new Property("string", "Related to data_btl and data_btlSet"),
		field_0x38: "string",
		field_0x40: new Property("int", `
Usage unknown, but could determine how it handles collision.

Previously called 'Collision Flag', but this is not a boolean.`),
		field_0x44: "int",
		field_0x48: "float",
		field_0x4c: "float",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		walkOrigin: new Property("Vector3", "The origin the NPC walks around."),
		walkRadius: new Property("Vector3", "The distance that the NPC is allowed to move around the origin."),
		field_0x78: "float",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		chaseOrigin: "Vector3",
		chaseRadius: "Vector3",
		field_0xa0: "float",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "int",
		field_0xb4: "int",
		field_0xb8: "float",
		field_0xbc: "int",
		field_0xc0: "int",
		field_0xc4: "int",
		initFunction: new Property("string", `The function that is called when it loads. ${scriptDisclaimer}`),
		field_0xd0: "int",
		field_0xd4: "int",
		field_0xd8: "int",
		field_0xdc: "int",
		talkFunction: new Property("string", `The function that is called when the NPC is talked to. ${scriptDisclaimer}`),
		actionFunction: new Property("string", `The function that is called when the NPC is interacted with. ${scriptDisclaimer}`),
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "int",
		field_0xfc: "int",
	},
	
	[DataType.Item]: {
		stage: "string",
		id: "string",
		type: "string",
		position: "Vector3",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "string",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "float",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "float",
		field_0x78: "int",
		field_0x7c: "int",
	},
	
	[DataType.Mobj]: {
		stage: "string",
		id: "string",
		type: "string",
		position: "Vector3",
		rotation: "Vector3",
		field_0x30: "byte",
		field_0x31: "byte",
		field_0x32: "byte",
		field_0x33: "byte",
		field_0x34: "int",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4C: "int",
		field_0x50: "string",
		field_0x58: "int",
		field_0x5C: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6C: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7C: "int",
		field_0x80: "string",
		field_0x88: "string",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9C: "int",
		field_0xA0: "int",
		field_0xA4: "int",
		field_0xA8: "int",
		field_0xAC: "float",
		field_0xB0: "int",
		field_0xB4: "int",
		field_0xB8: "int",
		field_0xBC: "int",
		field_0xC0: "int",
		field_0xC4: "int",
		field_0xC8: "int",
		field_0xCC: "int",
		field_0xD0: "int",
		field_0xD4: "int",
		field_0xD8: "float",
		field_0xDC: "int",
		field_0xE0: "int",
		field_0xE4: "int",
		field_0xE8: "int",
		field_0xEC: "int",
		field_0xF0: "int",
		field_0xF4: "int",
		initFunction: new Property("string", `The function that is called when it loads. ${scriptDisclaimer}`),
		field_0x100: "int",
		field_0x104: "int",
		accessFunction: new Property("string", `The function that is called when being interacted with. \
If set to null, then no A prompt will be displayed.\n\n${scriptDisclaimer}`),
		field_0x110: "int",
		field_0x114: "int",
		field_0x118: "int",
		field_0x11C: "int",
		field_0x120: "int",
		field_0x124: "int",
		field_0x128: "int",
		field_0x12C: "int",
		field_0x130: "int",
		field_0x134: "int",
		field_0x138: "int",
		field_0x13C: "int",
		field_0x140: "int",
		field_0x144: "int",
		field_0x148: "int",
		field_0x14C: "int",
		field_0x150: "int",
		field_0x154: "int",
		field_0x158: "int",
		field_0x15C: "int",
		field_0x160: "int",
		field_0x164: "int",
		field_0x168: "int",
		field_0x16C: "int",
		field_0x170: "int",
		field_0x174: "int",
	},
	
	[DataType.Aobj]: {
		stage: "string",
		id: "string",
		type: "string",
		position: "Vector3",
		rotation: new Property("Vector3", "I don't actually know whether this really is rotation, this is just an educated guess. \
Please verify."),
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: new Property("string", "Seems to contain \"GF\" sometimes. Not sure why and what this means though."),
		field_0x40: "string",
		field_0x48: "int",
		field_0x4c: "int",
		item: "string",
		field_0x58: "int",
		field_0x5c: "int",
		item2: "string",
		field_0x68: "int",
		field_0x6c: "int",
		item3: "string",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "float",
		field_0xa8: "int",
		field_0xac: "float",
		field_0xb0: "int",
		field_0xb4: "int",
		field_0xb8: "int",
		field_0xbc: "int",
		field_0xc0: "int",
		field_0xc4: "int",
		field_0xc8: "int",
		field_0xcc: "int",
		field_0xd0: "int",
		field_0xd4: "int",
		field_0xd8: "int",
		field_0xdc: "int",
		field_0xe0: "int",
		field_0xe4: "int",
		field_0xe8: "int",
		field_0xec: "int",
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "int",
		field_0xfc: "int",
		field_0x100: "int",
		field_0x104: "int",
		field_0x108: "string",
		field_0x110: "int",
		field_0x114: "int",
		field_0x118: "int",
		field_0x11c: "int",
		field_0x120: "int",
		field_0x124: "int",
		field_0x128: "int",
		field_0x12c: "int",
		field_0x130: "int",
		field_0x134: "int",
		field_0x138: "int",
		field_0x13c: "int",
		field_0x140: "int",
		field_0x144: "int",
		field_0x148: "int",
		field_0x14c: "int",
		field_0x150: "int",
		field_0x154: "int",
		field_0x158: "int",
		field_0x15c: "int",
		field_0x160: "int",
		field_0x164: "int",
		field_0x168: "int",
		field_0x16c: "int",
		field_0x170: "int",
		field_0x174	: "int",
	},
	
	[DataType.BShape]: {
		stage: "string",
		id: "string",
		position: "Vector3",
		rotation: "Vector3",
		field_0x28: "int",
		cubeSize: "Vector3",
		field_0x38: "float",
		field_0x3C: "int",
		field_0x40: "string",
		field_0x48: "int",
		field_0x4C: "int",
	},
	
	[DataType.Maplink]: {
		__objectType: dataDivisions.maplinkNodes,
		
		stage: "string",
		id: "string",
		destinationStage: "string",
		destinationId: "string",
		type: new Property("string", `
Type type of the link. Possible values:

* Dokan = pipe
* 土管：下 = Vertical pipe
`),
		objectId: new Property("string", `This is for linking a map exit to a Mobj, BShape, or map collision`),
		rotationDegrees: "float",
		field_0x34: "int",
		field_0x38: new Property("string", "Related to doors\n\nExample: \"Door_Goal\""),
		// field_0x3c: "int",
		beroBShape: new Property("string", "If type is set to Bero (\"ベロ\"), then this is probably the BShape related \
to its collision area."),
		// field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "string",
		saveOnExit: "int",
		field_0x5c: "int",
		direction: new Property("string", `
The direction in which the link is facing. Possible values, among others:

* 右後ろ - right back
* 右 - right
* 左 - left
* Possibly more.`),
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: new Property("string", `
Related to pipes and maybe cameras? The example strings below can't be found in any .cam file, so I'm not sure.

Examples: "Cam_Dokan02", "Cam_Dokan03"`),
		field_0x80: new Property("string", `
Related to pipes and maybe cameras? The example string below can't be found in any .cam file, so I'm not sure.

Example: "Cam_Dokan"`),
		field_0x88: "int",
		field_0x8c: "int",
		enterFunction: new Property("string", `Either the function called when entering a stage, or entering a transition. Please check.\
\n\n${scriptDisclaimer}`),
		exitFunction: new Property("string", `Either the function called when exiting a stage, or exiting a transition. Please check.\
\n\n${scriptDisclaimer}`),
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
	},
	
	[DataType.MaplinkHeader]: {
		__displayName: "Link",
		
		stage: "string",
		linkAmount: "int",
		field_0xc: "int",
		linkPointer: "long",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
	},
	
	[DataType.DataNpc]: {
		__displayName: "NPC Type",
		
		id: "string",
		modelId: new Property("string", "Reference to data_model_npc.elf"),
		rotationBehavior: new Property("int", `
Determines how the NPC rotates. Possible values:

* 0 - the object's rotation is only modified by scripts. allows 360° rotation.
* 1 - the object's rotation is locked into left, right and the back facing variations (which try to use back sprites).
* 2 - the object faces the player when they get close or interact. allows 360° rotation.
* everything else behaves like 2`),
		field_0x14: "int",
		textureSubclass: "string",
		alwaysFacesFront: new Property("bool32", `
If set to true, the NPC will not turn backwards or forwards but only turn horizontally.`),
		field_0x24: "int",
		instanceScriptFilename: "string",
		instanceScriptNamespace: new Property("string", `
The namespace for the common instance functions of the NPC.
Appears to only apply to the file name given above.

Additionally, when the instance script filename is set to
\`npc_dummy\`, then this field appears to always be null.

Examples:

* \`GES\`
* \`knp\`
* \`hei\`
* \`Crab::Normal\`

Some examples of functions that are in this namespace:

* \`void <namespace>::npc_init()\`
* \`void <namespace>::ResetMain(npc::Handle)\`
* \`void <namespace>::ResetAction(npc::Handle)\`
* \`void <namespace>::ResetExit(npc::Handle)\`
* \`void <namespace>::npc_main()\`
* \`void <namespace>::npc_action()\`
* \`void <namespace>::npc_exit()\`
* \`void <namespace>::npc_encount()\`
* \`void <namespace>::npc_exit_by_first_attack()\`

`),
		field_0x38: "int",
		field_0x3c: "float",
		field_0x40: "float",
		field_0x44: "float",
		field_0x48: "float",
		field_0x4c: "float",
		field_0x50: "float",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "string",
		field_0x70: "string",
		field_0x78: "string",
		field_0x80: "string",
		landingSfx: "string",
		jumpedOnSfx: "string",
		hammeredOnSfx: "string",
		jumpSfx: "string",
		field_0xa8: new Property("int", "Alwasy zero, for some reason"),
		field_0xac: new Property("int", "Alwasy zero, for some reason"),
		field_0xb0: "string",
		talkSfx: "string",
		field_0xc0: "string",
		field_0xc8: "string",
		field_0xd0: "string",
		field_0xd8: "string",
		field_0xe0: "string",
		field_0xe8: "string",
		field_0xf0: "string",
		field_0xf8: "string",
		field_0x100: "string",
		field_0x108: "string",
	},
	
	[DataType.Hand]: {
		stage: "string",
		id: "string",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: "string",
		field_0x20: "string",
		field_0x28: "string",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "float",
		field_0x5c: "float",
		field_0x60: "float",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "float",
		field_0x78: "float",
		field_0x7c: "float",
		field_0x80: "float",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "float",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "float",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "float",
		field_0xb4: "int",
		field_0xb8: "int",
		field_0xbc: "int",
		field_0xc0: new Property("string", "Probably the script function that gets called when the magic circle is touched"),
		field_0xc8: new Property("string", "Probably the script function that gets called when the magic circle is activated"),
		field_0xd0: new Property("string", "Possibly the script function that gets called when the magic circle is canceled"),
		field_0xd8: new Property("string", "Possibly the script function that gets called when the magic circle is finished with success"),
		field_0xe0: "int",
		field_0xe4: "int",
		field_0xe8: "int",
		field_0xec: "int",
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "string",
		field_0x100: "int",
		field_0x104: "int",
		field_0x108: "int",
		field_0x10c: "int",
		field_0x110: "int",
		field_0x114: "int",
		field_0x118: "float",
		field_0x11c: "int",
	},
	
	[DataType.Hariko]: {
		stage: "string",
		id: "string",
		type: "string",
		position: "Vector3",
		rotationDegrees: "float",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		walkRadius: "Vector3",
		walkDistance: "Vector3",
		field_0x58: "float",
		field_0x5c: "int",
		field_0x60: "float",
		field_0x64: "float",
		field_0x68: "float",
		field_0x6c: "float",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		chaseRadius: "Vector3",
		chaseDistance: "Vector3",
		field_0x98: "float",
		field_0x9c: "int",
		field_0xa0: "string",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "int",
		field_0xb4: "int",
		field_0xb8: "string",
		field_0xc0: "int",
		field_0xc4: "int",
		field_0xc8: "int",
		field_0xcc: "int",
		field_0xd0: "int",
		field_0xd4: "int",
		field_0xd8: "int",
		field_0xdc: "int",
		field_0xe0: "int",
		field_0xe4: "int",
		field_0xe8: "int",
		field_0xec: "int",
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "int",
		field_0xfc: "int",
	},
	
	[DataType.Hole]: {
		stage: "string",
		id: "string",
		description: new Property("string", `
Could also have a purpose but I doubt it.

Examples with translations:

* １回以下で修復　小さく = Repair in less than 1 time. Small.
* ２回で修復ぐらいに　小さく = Small enough to repair in two tries.
* 縦方向をジャンプできないぐらい小さく = Small enough to not jump vertically.`),
		field_0x18: new Property("string", `
Usage unknown, but it's always one of these possible values: \
GET_YATARA_SMALL, GET_YATARA_MIDDLE or GET_YATARA_BIG.

Yatara (やたら) could mean "unreasonably" or "excessively".`),
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "float",
		field_0x38: "float",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: new Property("float", "Usage unknown, but could be in relation to the hole's size?"),
		field_0x50: "int",
		field_0x54: "int",
	},
	
	[DataType.Effect]: {
		stage: "string",
		id: "string",
		type: "string",
		position: "Vector3",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
	},
	
	[DataType.Sobj]: {
		stage: "string",
		id: "string",
		position: "Vector3",
		rotation: "Vector3",
		scale: "Vector3",
		loadFromEvent: "int",
		field_0x38: "int",
		field_0x3c: "int",
		modelLocation: "string",
		modelID: "string",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: new Property("float", `
Usage unknown, but I have a slight feeling that this could be (total) confetti given from hammering the object.

From the number scale, it would definitely be fitting.`),
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "int",
		field_0xb4: "int",
	},
	
	[DataType.Gobj]: {
		stage: "string",
		id: "string",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: new Property("string", "Seems to be the exact same as the ID. \
It's probably referencing something somewhere else."),
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "float",
		field_0x60: "float",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
	},
	
	[DataType.Lobj]: {
		stage: "string",
		id: "string",
		field_0x10: "int",
		field_0x14: "int",
		modelFolder: "string",
		modelName: new Property("string", `
It is important to note that KillzXGaming's Switch Toolbox can't properly deal with these lobj models.
That's probably because they don't contain any meshes, and instead, they only contain a skeleton.`),
	},
	
	[DataType.DigPoint]: {
		stage: "string",
		id: "string",
		bShape: "string",
		field_0x18: "int",
		field_0x1c: "int",
		itemSetEntry: new Property("string", `Item Set entry ID in Item_Set.elf.`),
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		digFunction: new Property("string", `Seems to be the function called when the dig point is digged up. ${scriptDisclaimer}`),
	},
	
	[DataType.ResourceGobj]: {
		__displayName: "Gobj Resource",
		__importantField: "type",
		
		stage: "string",
		type: "string",
		field_0x10: "int",
		field_0x14: "int",
	},
	
	[DataType.DataItem]: {
		__displayName: "Item Type",
		
		id: "string",
		description: "string",
		type: new Property("string", `
The type of the item which determines how it behaves. Possible values:

* "Icon" - item will trigger something and immediately be discarded (like coins or hearts)
* "Pouch" - item will be added to the item inventory
* "Magic" - Velluminal books
* "KeyItem" - key item
* "Collectable" - trophy, collectibleModelId determines displayed mesh (probably misspelling of Collectible)
`),
		modelId: "string",
		textureId: "string",
		collectibleModelId: "string",
		itemGrade: new Property("int", `
I don't know what this does but this is a pattern that I noticed:

* 0 - everything else
* 1 - common weapons and items
* 2 - silver and golden weapons as well as fire and ice flowers
* 3 - shiny weapons
* 4 - flashy weapons
* >4 - collectibles

My original thought was the shine on an item, but then I saw the collectibles
which have values up to 99.`),
		buyPrice: "int",
		sellPrice: new Property("int", "Unused as it is not possible to sell items"),
		variable: new Property("int", `
The variable to increase. Possible values:

* 0 increases coins.
* 1 increases HP.
* 2 increases Level (Maximum HP and Attack Damage).
* 3 increases confetti.
`),
		value: "int",
		field_0x44: "int",
		textId: new Property("string", `
The name of the item. Before it is displayed, it is looked up in \`glossary.msbt\`.

This is also used for the collectible names, which are looked up
in \`item.msbt\` with this value as the identifier.`),
		field_0x50: "int",
		field_0x54: "int",
		helpText: new Property("string", "Reference to item.msbt"),
		iconId: new Property("string", `
The ID for the icon to display in GUIs. References ui/ItemIcon.bntx.zst.

* Prefix 'B' is for Boots, 'H' is for hammers,
* 'I' for normal items (e.g. Ice Flower, Mushroom),
* 'S' for bundled shop set items,
* 'C' for accessories and 'K' for key items
`),
		field_0x68: "bool8",
		useInBattle: "bool8",
		useInField: "bool8",
		useInMenu: "bool8",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7C: "int",
		field_0x80: "int",
		field_0x84: "int",
		collectSfx: "string",
		collectEffect: "string",
		idleEffect: "string",
		landingSfx: "string",
		initFunction: new Property("string", `The function that is called when it loads. ${scriptDisclaimer}`),
		onCollectFunction: new Property("string", "Please verify."),
		onUseFunction: "string",
		field_0xc0: "int",
		field_0xc4: "int",
		battleAttackId: "string",
	},
	
	[DataType.DataMap]: {
		__displayName: "Map",
		__importantField: "fullId",
		
		field_0x0: new Property("string", `
Always contains on of these values:

* "finalize"
* "rough"
* "sample"
* "test"
* "battle"

Usage unknown.
`),
		fullId: "string",
		levelId: "string",
		worldId: "string",
		field_0x20: "int",
		field_0x24: "int",
		assetFolder: "string",
		assetName: "string",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		scriptLocation: "string",
		field_0x50: "string",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "string",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "int",
		field_0xb4: "int",
		field_0xb8: "string",
	},
	
	[DataType.DataNpcModel]: {
		__displayName: "NPC Model",
		__countSymbol: "wld::fld::data::modelNpc_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.NpcFiles]: {
		__displayName: "Asset Group",
		__importantField: "fileName",
		__nestedAllValues: true,
		__objectType: dataDivisions.assetGroup,
		
		modelFolder: "string",
		fileName: "string",
		field_0x10: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
	},
	
	[DataType.NpcState]: {
		__displayName: "State",
		__importantField: "description",
		__childFieldLabel: "faceArrays",
		__childField: "substates",
		__nestedAllValues: true,
		__objectType: dataDivisions.state,
		__childTypes: {
			substates: DataType.NpcSubState,
		},
		
		description: new Property("string", `
Description of the state, which doesn't seem to have an effect on its behavior.
Some commonly found translations:

* 通常 = normal
* ダメージ = damage
* 変形 = deformation/variation
`),
		substates: new Property("pointer", undefined, {hidden: true}),
		substateCount: new Property("int", undefined, {hidden: true}),
		field_0x14: new Property("int", undefined, {hidden: true}),
	},
	
	[DataType.NpcSubState]: {
		__displayName: "Face Array",
		__childField: "faces",
		__nestedAllValues: true,
		__objectType: dataDivisions.subState,
		__childTypes: {
			faces: DataType.NpcFace,
		},
		
		field_0x0: "int",
		field_0x4: "int",
		faces: new Property("pointer", undefined, {hidden: true}),
		faceCount: new Property("int", undefined, {hidden: true}),
		field_0x14: "int",
	},
	
	[DataType.NpcFace]: {
		__displayName: "Face",
		__childField: "animations",
		__nestedAllValues: true,
		__objectType: dataDivisions.face,
		__childTypes: {
			animations: DataType.NpcAnime,
		},
		
		field_0x0: "int",
		field_0x4: "int",
		// internally also called "anime"
		animations: new Property("pointer", undefined, {hidden: true}),
		animationCount: new Property("int", undefined, {hidden: true}),
		field_0x14: "int",
	},
	
	[DataType.NpcAnime]: {
		__displayName: "Animation",
		__nestedAllValues: true,
		__objectType: dataDivisions.anime,
		
		description: "string",
		id: "string",
	},
	
	[DataType.DataHariko]: {
		__displayName: "Hariko Type",
		
		id: "string",
		modelId: "string",
		field_0x10: "string",
		field_0x18: "string",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "float",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "float",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "string",
		field_0x58: "string",
		field_0x60: "string",
	},
	
	// [DataType.DataMuseum]: {
	// 	__displayName: "Museum Entry",
		
	// 	id: "string",
	// 	field_0x8: "string",
	// 	field_0x10: "string",
	// 	field_0x18: "string",
	// 	field_0x20: "int",
	// 	field_0x24: "int",
	// 	field_0x28: "string",
	// 	field_0x30: "int",
	// 	field_0x34: "int",
	// 	field_0x38: "int",
	// 	field_0x3c: "int",
	// 	field_0x40: "string",
	// 	// field_0x44: "int",
	// },
	
	[DataType.DataBtlSet]: {},
	
	[DataType.BtlSetCategory]: {
		__displayName: "Set",
		__nestedAllValues: true,

		id: "string",
		field_0x8: "string",
		battle: "symbol",
		enemyCount: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		bossBattle: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		battleBackground: new Property("string", `
The background asset group. The files in this asset group are found 
in romfs/map/battle/.

They always have the same file name as the asset group
and usually have one of these extensions: .bfres, .probe and .light.bfres.`),
		backgroundMusic: new Property("string", `
The background music file that plays during the battle. It is found in romfs/sound/stream/`),
		eventScript: "string",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "string",
		field_0xb8: "string",
		field_0xc0: "string",
		field_0xc8: "string",
		field_0xd0: "string",
		field_0xd8: "string",
		rotatingObstacle: "string",
		slidingObstacle: "string",
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "int",
		field_0xfc: "int",
		field_0x100: "int",
		field_0x104: "int",
		field_0x108: "int",
		field_0x10c: "int",
		field_0x110: "int",
		field_0x114: "int",
		spawnShoeGoomba: "int",
		field_0x11c: "int",
	},
	
	[DataType.BtlSetElement]: {
		__displayName:  "Enemy",
		__importantField: "type",
		__nestedAllValues: true,
		__objectType: dataDivisions.element,

		type: new Property("string", `
The type of the enemy. While it is similar to the NPC ID's (e. g. P_KNP, O_KUR, ...),
it seems to never contain the 'O_' prefix, which means that it has to be referencing something else.
Where it is referencing to is not known yet.

Maybe, it is referencing data_btl, but that is just an idea.`),
		ringPosition: "int",
		linePosition: "int",
		field_0x10: "int",
		field_0x14: "int",
		ringSection: "int",
		lineSection: "int",
		field_0x20: new Property("string", 'Examples: "koura", "sleep", "turn"'),
		field_0x28: new Property("string", "Examples: 回転 (rotate), Lab, RetrySecond"),
		puzzleSolverCircle: new Property("string", `
Sometimes contains unicode circle character "〇".
Seems to indicate whether the Puzzle Solver from the battle lab should show a circle.`),
		field_0x38: "int",
		field_0x3c: "int",
	},
	
	/**
	 * This is a metadata object in data_btlSet fight/element objects.
	 * TODO: The fact that this data type exists is so stupid.
	 */
	[DataType.Metadata]: {
		symbolName: new Property("string", "The identifier of this fight.", {noSpaces: true}),
		objects: new Property("string", undefined, {hidden: true}),
	},
	
	[DataType.DataItemSet]: {
		__displayName: "Item Set",
		
		id: "string",
		itemCount: "int",
		field_0xc: "int",
		item1: "string",
		item1DropRate: "int",
		item1Amount: "float",
		item2: "string",
		item2DropRate: "int",
		item2Amount: "float",
		item3: "string",
		item3DropRate: "int",
		item3Amount: "float",
		item4: "string",
		item4DropRate: "int",
		item4Amount: "float",
		itemTotal: new Property("int", "Might be the amount of total items dropped. Not sure yet."),
		dropRateTotal: "int",
		field_0x58: "int",
		field_0x5c: "int",
	},
	
	[DataType.DataItemModel]: {
		__displayName: "Item Model",
		__countSymbol: "wld::fld::data::modelItem_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataGobjModel]: {
		__displayName: "Gobj Model",
		__countSymbol: "wld::fld::data::modelGobj_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataHarikoModel]: {
		__displayName: "Hariko Model",
		__countSymbol: "wld::fld::data::modelHariko_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataNaviModel]: {
		__displayName: "Navigator Model",
		__countSymbol: "wld::fld::data::modelNavi_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataMobjModel]: {
		__displayName: "Mobj Model",
		__countSymbol: "wld::fld::data::modelMobj_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataPlayerModel]: {
		__displayName: "Player Model",
		__countSymbol: "wld::fld::data::modelPlayer_num",
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.DataMobj]: {
		__displayName: "Mobj Type",
		
		id: "string",
		description: "string",
		modelId: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: new Property("string", `
Usage unknown, but could be related to hitting the Mobj?
Brake could be misspelled for "break" and DRP could be short for "drop"?

Also probably related to data_mobj_model or something similar to that.

Examples: "DRP_MOBJ_BRAKE_METAL", "DRP_MOBJ_TREE_2", "DRP_MOBJ_BRAKE_CRAFT"`),
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: new Property("string", "Same as field_0x20. See that for more information."),
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: new Property("string", "Same as field_0x20 and field_0x30. See that for more information."),
		field_0x48: "int",
		field_0x4c: "int",
		scriptPath: new Property("string", `
The path of the script file, starting at romfs/script/wld/fld/mobj/. Also, the file extension is omitted.

Example: "mobj_dummy" -> romfs/script/wld/fld/mobj/mobj_dummy.bin.zst`),
		initFunction: new Property("string", `
The function inside the script from scriptPath to initialize the Mobj.
If set to null, it will default to "init".`),
		mainFunction: new Property("string", `
"main" function inside the script from scriptPath. What exactly it's doing is not certain, but it
might be the interaction function (called when pressing A; similar to talking) or the function that's being called every frame. 
No idea what sets it apart from actionFunction.`),
		actionFunction: new Property("string", `
"action" function inside the script from scriptPath. What exactly it's doing is not certain, but it
might be the interaction function (called when pressing A; similar to talking). No idea what sets it apart from mainFunction.`),
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
	},
	
	[DataType.DataAobj]: {
		__displayName: "Aobj Type",
		
		id: "string",
		description: "string",
		modelId: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		scriptPath: new Property("string", `
The path of the script file, starting at romfs/script/wld/fld/mobj/. Also, the file extension is omitted.

Example: "mobj_dummy" -> romfs/script/wld/fld/mobj/mobj_dummy.bin.zst`),
		initFunction: new Property("string", `
The function inside the script from scriptPath to initialize the Aobj.
If set to null, it will default to "init".`),
		field_0x60: "int",
		field_0x64: "int",
		actionFunction: new Property("string", `
"action" function inside the script from scriptPath. What exactly it's doing is not certain, but it
might be the interaction function (called when pressing A; similar to talking).`),
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
	},
	
	[DataType.DataConfettiTotalHoleInfo]: {},
	
	[DataType.ConfettiVersion]: {
		__displayName: "General Information",
		__objectType: dataDivisions.version,
		
		version: "long",
	},
	
	[DataType.ConfettiData]: {
		__displayName: "Data Header",
		__nestedAllValues: false,
		__objectType: dataDivisions.dataHeader,

		field_0x0: "int",
		field_0x4: "int",
		mapCount: "int",
		field_0xc: "int",
		maps: new Property("pointer", undefined, {hidden: true}),
	},
	
	[DataType.ConfettiMap]: {
		__displayName: "Map",
		__nestedAllValues: false,
		__objectType: dataDivisions.map,
		__childTypes: {
			holes: DataType.ConfettiHole,
		},
		
		id: "string",
		holeCount: "int",
		field_0xc: "float",
		holes: new Property("pointer", undefined, {tabName: "Holes for {id}"}),
	},
	
	[DataType.ConfettiHole]: {
		__displayName: "Hole",
		__nestedAllValues: true,
		__objectType: dataDivisions.hole,
		
		id: "string",
		field_0x8: "int",
		field_0xc: "float",
		field_0x10: "float",
		field_0x14: "int",
	},
	
	[DataType.DataEffect]: {
		__displayName: "Effect Type",
		
		id: "string",
		field_0x8: "string",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: "string",
		field_0x20: "string",
		field_0x28: "string",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "float",
		field_0x70: "float",
		field_0x74: "float",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
	},
	
	[DataType.DataMaplinkZoom]: {
		__displayName: "Maplink Zoom",
		
		id: "string",
		field_0x8: "int",
		field_0xc: "int",
		field_0x10: "int",
		field_0x14: "float",
		field_0x18: "string",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "float",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "float",
	},
	
	[DataType.DataParty]: {
		__displayName: "Party Member",
		
		id: "string",
		modelId: "string",
		field_0x10: "int",
		field_0x14: "int",
		textureSubclass: "string",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "string",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "string",
		field_0x60: "string",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "string",
		field_0x78: "string",
		field_0x80: "string",
		field_0x88: "string",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "string",
		field_0xa0: "string",
		field_0xa8: "string",
		field_0xb0: "string",
		field_0xb8: "string",
	},
	
	[DataType.DataUi]: {},
	
	[DataType.UiModel]: {
		__displayName: "Model",
		__objectType: dataDivisions.model,
		__childTypes: {
			properties: DataType.UiModelProperty,
		},
		
		id: "string",
		modelFolder: "string",
		modelFileName: new Property("string", `
Not sure what this is for. It seems like it's the same as \`id\`.`),
		properties: new Property("pointer", undefined, {tabName: "Model Properties of {id}"}),
		propertyCount: new Property("int", undefined, {hidden: true}),
		field_0x24: "int",
	},
	
	[DataType.UiModelProperty]: {
		__displayName: "Model Property",
		__objectType: dataDivisions.modelProperty,
		
		id: "string",
		model: "string",
		field_0x10: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "float",
		field_0x24: "int",
		field_0x28: "string",
		field_0x30: "string",
		field_0x38: "int",
		field_0x3c: "int",
	},
	
	[DataType.UiMsg]: {
		__displayName: "Message",
		__objectType: dataDivisions.msg,
		
		id: "string",
		modelAsset: "string",
		field_0x10: "string",
		field_0x18: "string",
		field_0x20: "string",
		openSfx: "string",
		closeSfx: "string",
		field_0x38: "float",
		field_0x3c: "float",
		field_0x40: "float",
		field_0x44: "float",
		field_0x48: "float",
		field_0x4c: "float",
		field_0x50: "float",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "string",
		field_0x78: "int",
		field_0x7c: "int",
	},
	
	[DataType.UiShop]: {
		__displayName: "Shop",
		__objectType: dataDivisions.shop,
		__childTypes: {
			soldItems: DataType.UiSellItem,
		},
		
		id: "string",
		soldItems: new Property("symbol", undefined, {tabName: "Sold Items of {id}"}),
		soldItemCount: new Property("int", undefined, {hidden: true}),
		field_0x14: "int",
	},
	
	[DataType.UiSellItem]: {
		__displayName: "Sold Item",
		__objectType: dataDivisions.sellItem,
		
		id: "string",
		itemGiven: "string",
		quantityGiven: "int",
		field_0x14: "int",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		availabilityEvent: "string",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "string",
		field_0x48: "int",
		field_0x4c: "int",
		placementBone: "string",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
	},
	
	[DataType.UiSeaMap]: {
		__displayName: "Map Entry",
		__objectType: dataDivisions.seaEntry,
		
		id: "string",
		group: "string",
		field_0x10: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "string",
		field_0x28: "string",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "string",
		field_0x48: "int",
		field_0x4c: "int",
	},
	
	[DataType.UiMenu]: {
		__displayName: "Menu",
		__objectType: dataDivisions.menu,
		
		stage: "string",
		id: "string",
		field_0x10: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "string",
		field_0x28: "string",
		field_0x30: "string",
		field_0x38: "string",
		field_0x40: "string",
		field_0x48: "string",
		field_0x50: "string",
		field_0x58: "string",
		field_0x60: "string",
		field_0x68: "string",
		field_0x70: "string",
		field_0x78: "string",
		field_0x80: "string",
		field_0x88: "string",
		field_0x90: "string",
		field_0x98: "string",
		field_0xa0: "string",
		field_0xa8: "string",
		field_0xb0: "string",
		field_0xb8: "string",
		field_0xc0: "string",
		field_0xc8: "string",
		field_0xd0: "string",
		field_0xd8: "string",
		field_0xe0: "string",
		field_0xe8: "string",
		field_0xf0: "string",
		field_0xf8: "string",
		field_0x100: "string",
		field_0x108: "string",
		field_0x110: "string",
		field_0x118: "string",
		field_0x120: "string",
		field_0x128: "string",
		field_0x130: "string",
		field_0x138: "string",
		field_0x140: "string",
		field_0x148: "string",
		field_0x150: "string",
		field_0x158: "string",
		field_0x160: "string",
		field_0x168: "string",
		field_0x170: "string",
		field_0x178: "string",
	},
	
	[DataType.UiAnnouncement]: {
		__displayName: "Announcement",
		__objectType: dataDivisions.announcement,
		
		number: "int",
		field_0x4: "int",
		id: "string",
		field_0x10: "string",
		field_0x18: "string",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
	},
	
	[DataType.UiAnnouncementExclude]: {
		__displayName: "Announcement Exclude",
		__objectType: dataDivisions.announcementExclude,
		
		id: "string",
		field_0x8: "int",
		field_0xc: "int",
		field_0x10: "int",
		field_0x14: "int",
	},
	
	[DataType.DataBtl]: {},
	
	[DataType.BtlModel]: {
		__displayName: "Battle Model",
		__countSymbol: "wld::btl::data::modelBattle_num",
		__objectType: dataDivisions.model,
		__childTypes: {
			assetGroups: DataType.NpcFiles,
			states: DataType.NpcState,
		},
		
		__parent: modelDataType,
	},
	
	[DataType.BtlPart]: {
		__displayName: "Part",
		__objectType: dataDivisions.part,
		
		id: "string",
		bossParts: new Property("string", `
I am sure that I marked too many fields as strings.

TODO: verify that every field that is marked as a string is actually a string`),
		modelId: "string",
		field_0x18: "int",
		field_0x1c: "float",
		field_0x20: "string",
		jumpWalkDistance: "float",
		jumpHeightDistance: "float",
		field_0x30: "float",
		field_0x34: "float",
		field_0x38: "float",
		field_0x3c: "float",
		field_0x40: "float",
		field_0x44: "float",
		field_0x48: "float",
		field_0x4c: "float",
		field_0x50: "float",
		field_0x54: "float",
		field_0x58: "float",
		field_0x5c: "float",
		field_0x60: "float",
		field_0x64: "float",
		field_0x68: "float",
		field_0x6c: "float",
		field_0x70: "float",
		field_0x74: "float",
		field_0x78: "float",
		field_0x7c: "float",
		field_0x80: "float",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
		attackPosition1: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition2: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition3: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition4: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition5: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition6: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition7: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition8: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition9: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition10: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition11: new Property("string", "Position where this actor can be attacked from in boss battles."),
		attackPosition12: new Property("string", "Position where this actor can be attacked from in boss battles."),
		defenseType: new Property("int", `
Determines if an enemy is Grounded, Floating, Flying etc.
To give mutiple attributes, pick them and add them together. Known Values:

* 1 = Grounded
* 2 = Floating
* 4 = Flying
* 16 = On Fire
* 32 = Is Cold?
* 256 = Spiked
* 2048 = Transforms
* 4096 = Flippable`),
		field_0xfc: "int",
		field_0x100: "int",
		jumpResistance: new Property("float", `
Resistance to this type of attack.
Known Values:

* -1012.0 = -998440960 = 0.5 Damage
* -999.0 = -998653952 = No Damage
* -2001.0 = -990240768 = Does 2 Damage
* -1001.0 = -998621184 =  Does 1.5 damage`),
		hammerResistance: "float",
		throwHammerResistance: "float",
		powResistance: "float",
		earthResistance: "float",
		waterResistance: "float",
		fireResistance: "float",
		iceResistance: "float",
		field_0x124: "float",
		field_0x128: "float",
		flipResistance: "float",
		field_0x130: "float",
		field_0x134: "float",
		field_0x138: "float",
		field_0x13c: "float",
		field_0x140: "float",
		field_0x144: "float",
		golfResistance: "float",
		field_0x14c: "float",
	},
	
	[DataType.BtlUnit]: {
		__displayName: "Actor",
		__objectType: dataDivisions.unit,
		
		id: "string",
		baseModel: new Property("string", "Originally thought to be referencing models, but that's not true."),
		field_0x10: new Property("string", "A sort of variant of the model? But I'm not sure what it influences exactly"),
		description: "string",
		textId: new Property("string", "The name of the item. Before it is displayed, it is looked up in `glossary.msbt`."),
		hasBeenKilledSwitch: new Property("string", "Switch in the save file for whether this enemy type has been killed at least once"),
		healthPoints: new Property("int", "The amount of health this actor has."),
		field_0x34: "int",
		panelType: "string",
		panelValue: "int",
		hurtboxSize: "Vector3",
		field_0x50: "int",
		field_0x54: "int",
		itemDrop: new Property("string", "The item that this actor will drop after a battle. This uses the item ids found in `data_itemset.elf`."),
		battleScript: "string",
		enemyConstructor: "string",
		firstPart: new Property("string", `
This uses models listed in the Parts section.
These are all the models that an actor uses in battle, and can weapon models like a Snifit Bullet, or a form change like a paratroopa turning into a regular koopa.

Example:

* First Part: PAT 
* Second Part: NOK`),
		secondPart: "string",
		thirdPart: "string",
		fourthPart: "string",
		fifthPart: "string",
		sixthPart: "string",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "int",
		field_0xb4: "int",
		field_0xb8: "int",
		field_0xbc: "int",
		skill1Description: "string",
		skill1MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0xcc: "int",
		skill1: "string",
		skill2Description: "string",
		skill2MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0xe4: "int",
		skill2: "string",
		skill3Description: "string",
		skill3MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0xfc: "int",
		skill3: "string",
		skill4Description: "string",
		skill4MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x114: "int",
		skill4: "string",
		skill5Description: "string",
		skill5MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x12c: "int",
		skill5: "string",
		skill6Description: "string",
		skill6MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x144: "int",
		skill6: "string",
		skill7Description: "string",
		skill7MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x15c: "int",
		skill7: "string",
		skill8Description: "string",
		skill8MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x174: "int",
		skill8: "string",
		skill9Description: "string",
		skill9MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x18c: "int",
		skill9: "string",
		skill10Description: "string",
		skill10MissRate: new Property("float", "Chance that the skill will miss. Higher value means higher miss chance."),
		field_0x1a4: "int",
		skill10: "string",
		field_0x1b0: "int",
		field_0x1b4: "int",
		field_0x1b8: "int",
		field_0x1bc: "int",
		hurtSfx: "string",
		spikeDamageSfx: "string",
		fireHurtSfx: "string",
		iceHurtSfx: "string",
		waterHurtSfx: "string",
		electricHurtSfx: "string",
		fireballHurtSfx: "string",
		iceballHurtSfx: "string",
		tailHurtSfx: "string",
		jumpSfx: "string",
		landSfx: "string",
		talkSfx: "string",
		field_0x220: "string",
		field_0x228: "string",
		fireHurtEffect: "string",
		iceHurtEffect: "string",
		waterHurtEffect: "string",
		jumpGfx: "string",
		landingGfx: "string",
		deadGfx: "string",
	},
	
	[DataType.BtlAttackRangeHeader]: {
		__displayName: "Attack Range",
		__objectType: dataDivisions.attackRangeHeader,
		__childField: "attackRange",
		__childFieldLabel: "content",
		__childTypes: {
			attackRange: DataType.BtlAttackRange,
		},
		
		id: "string",
		attackRange: new Property("symbol", undefined, {tabName: "Attack Range of {id}", hidden: true}),
	},
	
	[DataType.BtlAttackRange]: {
		__displayName: "Attack Range Data",
		__objectType: dataDivisions.attackRange,
		
		field_0x0: "int",
		ringSection: new Property("int", "From inner ring to outer ring, its 0, 1, 2, and 3. Used for ring rotations."),
		rotation: new Property("int", "When Mario is facing forward, this is the clockwise rotation of targets he can hit. He will misalign himself while attacking, but can still hit enemies."),
		rangeWidth: new Property("int", "The width that the attack range has"),
		rangeLength: new Property("int", "The length that the arrack range has"),
		field_0x14: "int",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
	},
	
	[DataType.BtlAttack]: {
		__displayName: "Attack",
		__objectType: dataDivisions.attack,
		
		id: "string",
		field_0x8: "string",
		attackRangeId: "string",
		bossBattleVariant: "string",
		textId: new Property("string", "The name of the attack. Before it is displayed, it is looked up in `battle_Attack.msbt`."),
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		baseValue: "int",
		niceValueIncrease: "int",
		greatValueIncrease: "int",
		excellentValueIncrease: "int",
		fiveActorDamage: new Property("int", "Group attacks will use this if there are five enemies attacking."),
		sixActorDamage: new Property("int", "Group attacks will use this if there are six enemies attacking."),
		sevenActorDamage: new Property("int", "Group attacks will use this if there are seven enemies attacking."),
		eightActorDamage: new Property("int", "Group attacks will use this if there are eight enemies attacking."),
		nineActorDamage: new Property("int", "Group attacks will use this if there are nine enemies attacking."),
		tenActorDamage: new Property("int", "Group attacks will use this if there are ten enemies attacking."),
		valueIncreaseRange: "int",
		twoActorRange: new Property("int", "The range the damage will increase when 2 actors are attacking at once."),
		threeActorRange: new Property("int", "The range the damage will increase when 3 actors are attacking at once."),
		fourActorRange: new Property("int", "The range the damage will increase when 4 actors are attacking at once."),
		fiveActorRange: new Property("int", "The range the damage will increase when 5 actors are attacking at once."),
		sixActorRange: new Property("int", "The range the damage will increase when 6 actors are attacking at once."),
		sevenActorRange: new Property("int", "The range the damage will increase when 7 actors are attacking at once."),
		eightActorRange: new Property("int", "The range the damage will increase when 8 actors are attacking at once."),
		nineActorRange: new Property("int", "The range the damage will increase when 9 actors are attacking at once."),
		tenActorRange: new Property("int", "The range the damage will increase when 10 actors are attacking at once."),
		field_0x84: "int",
		niceACEndFrame: new Property("int", "The frame which timing for pressing A for a Nice action command ends."),
		greatACEndFrame: new Property("int", "The frame which timing for pressing A for a Great action command ends."),
		excellentACEndFrame: new Property("int", "The frame which timing for pressing A for a Excellent action command ends."),
		failACEndFrame: new Property("int", "The time, in frames, for low long it takes for the failed command action to play."),
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		targetAttackability: new Property("int", "Ability to attack grounded or airborne enemies. 1814 for Airborne, 790 for Grounded."),
		field_0xb4: "int",
		attackType: new Property("int", `
Determines if an attack is Jump, Hammer, Pow etc.
The values are all a power of 2. Known entries are listed as an exponent.
To give mutiple attributes, pick them and add them together.

* 2^0 = Jump
* 2^1 = Hammer
* 2^2 = Normal
* 2^3 = Shell
* 2^4 = Item
* 2^5 = Magic
* 2^6 = Pow
* 2^7 = Tail
* 2^8 = Fire
* 2^9 = Ice
* 2^10 = Earth
* 2^11 = Water
* 2^17 = Player Specific Value
* 2^18 = Heal
* 2^19 = Counter
* 2^20 = UNKNOWN but you only target the first enemy in that encounter's list
* 2^28 = Partner Specific Attack Type
* 2^29 = Ignore Spike Defence`),
		field_0xbc: "int",
		stunEffect: "int",
		stunChance: "int",
		freezeEffect: "int",
		freezeChance: "int",
		field_0xd0: "int",
		field_0xd4: "int",
		field_0xd8: "int",
		field_0xdc: "int",
		attackTier: new Property("string", `
The tier of the attack. Possible values:

* null - normal
* "kira" - Shiny
* "kirakira" - Flashy
* "legend" - Legendary

For some reason, the naming scheme of the attacks themselves does not say much about the tier.
Many with the tier 'kirakira' only have 'kira' in their name while many 'kira' attacks do not have
any indicator in ther name.`),
		gFXType: new Property("int", `
Bit field for the attack GFX type. Known values:

* 2 - normal
* 128 - earth
* 256 - water
* 512 - fire
* 1024 - ice
* ...`),
		field_0xec: "int",
		scriptPath: "string",
		attackFunction: "string",
	},
	
	[DataType.BtlEventCamera]: {
		__displayName: "Event Camera",
		__objectType: dataDivisions.eventCamera,
		
		id: "string",
		field_0x8: "int",
		field_0xc: "float",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: "float",
		field_0x1c: "float",
		field_0x20: "float",
		field_0x24: "int",
		field_0x28: "float",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "int",
		field_0x38: "string",
		field_0x40: "string",
		field_0x48: "string",
		field_0x50: "string",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
	},
	
	[DataType.BtlBossAttack]: {
		__displayName: "Boss Attack",
		__objectType: dataDivisions.bossAttack,
		
		id: "string",
		field_0x8: "int",
		field_0xc: "int",
		leftGrab: new Property("string", "Bone ID for left hand of 1000-fold arms to grab. Located on enemy model's skeleton"),
		rightGrab: new Property("string", "Bone ID for right hand of 1000-fold arms to grab. Located on enemy model's skeleton"),
		field_0x20: "float",
		field_0x24: "float",
		field_0x28: "float",
		field_0x2c: "int",
		field_0x30: "float",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "float",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "string",
	},
	
	[DataType.BtlPuzzleLevel]: {
		__displayName: "Puzzle Level",
		__objectType: dataDivisions.puzzleLevel,
		
		id: "int",
		field_0x4: "int",
		field_0x8: "string",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: "int",
		field_0x1c: "int",
	},
	
	[DataType.BtlCheerTerms]: {
		__displayName: "Cheer Term",
		__objectType: dataDivisions.cheerTerm,
		
		id: "string",
		field_0x8: "string",
		field_0x10: "string",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "string",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		field_0x50: "int",
		field_0x54: "int",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "string",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "string",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		field_0xb0: "string",
		field_0xb8: "int",
		field_0xbc: "int",
		field_0xc0: "int",
		field_0xc4: "int",
		field_0xc8: "int",
		field_0xcc: "int",
		field_0xd0: "int",
		field_0xd4: "int",
		field_0xd8: "string",
		field_0xe0: "int",
		field_0xe4: "int",
		field_0xe8: "int",
		field_0xec: "int",
		field_0xf0: "int",
		field_0xf4: "int",
		field_0xf8: "int",
		field_0xfc: "int",
		field_0x100: "string",
		field_0x108: "int",
		field_0x10c: "int",
		field_0x110: "int",
		field_0x114: "int",
		field_0x118: "int",
		field_0x11c: "int",
		field_0x120: "int",
		field_0x124: "int",
		field_0x128: "string",
		field_0x130: "int",
		field_0x134: "int",
		field_0x138: "int",
		field_0x13c: "int",
		field_0x140: "int",
		field_0x144: "int",
		field_0x148: "int",
		field_0x14c: "int",
		field_0x150: "string",
		field_0x158: "int",
		field_0x15c: "int",
		field_0x160: "int",
		field_0x164: "int",
		field_0x168: "int",
		field_0x16c: "int",
		field_0x170: "int",
		field_0x174: "int",
		field_0x178: "string",
		field_0x180: "int",
		field_0x184: "int",
		field_0x188: "int",
		field_0x18c: "int",
		field_0x190: "int",
		field_0x194: "int",
		field_0x198: "int",
		field_0x19c: "int",
		field_0x1a0: "string",
		field_0x1a8: "int",
		field_0x1ac: "int",
		field_0x1b0: "int",
		field_0x1b4: "int",
		field_0x1b8: "int",
		field_0x1bc: "int",
		field_0x1c0: "int",
		field_0x1c4: "int",
		field_0x1c8: "string",
		field_0x1d0: "int",
		field_0x1d4: "int",
		field_0x1d8: "int",
		field_0x1dc: "int",
		field_0x1e0: "int",
		field_0x1e4: "int",
		field_0x1e8: "int",
		field_0x1ec: "int",
		field_0x1f0: "string",
		field_0x1f8: "int",
		field_0x1fc: "int",
		field_0x200: "int",
		field_0x204: "int",
		field_0x208: "int",
		field_0x20c: "int",
		field_0x210: "int",
		field_0x214: "int",
		field_0x218: "string",
		field_0x220: "int",
		field_0x224: "int",
		field_0x228: "int",
		field_0x22c: "int",
		field_0x230: "int",
		field_0x234: "int",
		field_0x238: "int",
		field_0x23c: "int",
	},
	
	[DataType.BtlCheer]: {
		__displayName: "Cheer Event",
		__objectType: dataDivisions.cheer,
		
		id: "string",
		field_0x8: "string",
		enter: "string",
		enemyEnter: "string",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		playerFirstStrike: "string",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "int",
		field_0x4c: "int",
		enemyFirstStrike: "string",
		field_0x58: "int",
		field_0x5c: "int",
		field_0x60: "int",
		field_0x64: "int",
		field_0x68: "int",
		field_0x6c: "int",
		field_0x70: "int",
		field_0x74: "int",
		field_0x78: "int",
		field_0x7c: "int",
		field_0x80: "int",
		field_0x84: "int",
		field_0x88: "int",
		field_0x8c: "int",
		solvePuzzle: "string",
		puzzleHint: "string",
		field_0xa0: "int",
		field_0xa4: "int",
		field_0xa8: "int",
		field_0xac: "int",
		puzzleSuccess: "string",
		field_0xb8: "int",
		field_0xbc: "int",
		field_0xc0: "int",
		field_0xc4: "int",
		field_0xc8: "int",
		field_0xcc: "int",
		puzzleFail: "string",
		field_0xd8: "int",
		field_0xdc: "int",
		field_0xe0: "int",
		field_0xe4: "int",
		field_0xe8: "int",
		field_0xec: "int",
		chooseCommand: "string",
		commandHint: "string",
		field_0x100: "int",
		field_0x104: "int",
		field_0x108: "int",
		field_0x10c: "int",
		playerAttack: "string",
		field_0x118: "int",
		field_0x11c: "int",
		field_0x120: "int",
		field_0x124: "int",
		field_0x128: "int",
		field_0x12c: "int",
		playerGuard: "string",
		field_0x138: "int",
		field_0x13c: "int",
		field_0x140: "int",
		field_0x144: "int",
		field_0x148: "int",
		field_0x14c: "int",
		playerWin: "string",
		field_0x158: "int",
		field_0x15c: "int",
		field_0x160: "int",
		field_0x164: "int",
		field_0x168: "int",
		field_0x16c: "int",
		field_0x170: "int",
		field_0x174: "int",
		field_0x178: "int",
		field_0x17c: "int",
		field_0x180: "int",
		field_0x184: "int",
		field_0x188: "int",
		field_0x18c: "int",
	},
	
	[DataType.BtlResourceField]: {
		__displayName: "Resource Category",
		__objectType: dataDivisions.resourceField,
		__childTypes: {
			"resources": DataType.BtlResource,
		},
		
		id: "string",
		description: "string",
		resources: new Property("symbol", undefined, {tabName: "Resources of {id}"}),
		resourceCount: new Property("int", undefined, {hidden: true}),
		field_0x1c: "int",
	},
	
	[DataType.BtlResource]: {
		__displayName: "Resource",
		__importantField: "assetName",
		__objectType: dataDivisions.resource,
		
		field_0x0: "int",
		field_0x4: "int",
		assetFolder: "string",
		assetName: "string",
	},
	
	[DataType.BtlConfig]: {
		__displayName: "Setting",
		__objectType: dataDivisions.config,
		
		id: "string",
		value: "float",
		field_0xc: "int",
		field_0x10: "int",
		field_0x14: "int",
		field_0x18: "int",
		field_0x1c: "int",
		field_0x20: "int",
		field_0x24: "int",
		field_0x28: "int",
		field_0x2c: "int",
		field_0x30: "int",
		field_0x34: "int",
		field_0x38: "int",
		field_0x3c: "int",
		field_0x40: "int",
		field_0x44: "int",
		field_0x48: "string",
		field_0x50: "string",
		field_0x58: "string",
		field_0x60: "string",
		field_0x68: "string",
		field_0x70: "string",
		field_0x78: "string",
		field_0x80: "string",
		field_0x88: "int",
		field_0x8c: "int",
		field_0x90: "int",
		field_0x94: "int",
		field_0x98: "int",
		field_0x9c: "int",
		field_0xa0: "int",
		field_0xa4: "int",
	},
} as const


function mapObject<A, B>(obj: {[key: string]: A}, fn: (value: [string, A], index: number) => [string, B]): {[key: string]: B} {
	return Object.fromEntries(Object.entries(obj).map(fn))
}
function filterObject<A>(obj: {[key: string]: A}, fn: (value: [string, A], index: number) => boolean): {[key: string]: A} {
	return Object.fromEntries(Object.entries(obj).filter(fn))
}

interface FileTypeRegistry {
	typedef: Typedef<PropertyType>
	metadata: Typedef<Property<PropertyType>>
	fieldOffsets: Typedef<string | number>
	size: number
	displayName: string
	childTypes: {[fieldName: string]: DataType}
	childFieldLabel: string
	childField: string
	identifyingField: string
	countSymbol: string
	nestedAllValues: boolean
	objectType: DataDivision
	entryPoints: {[objectType: number]: any}
	
	instantiate(): object
}

// @ts-ignore
export const FILE_TYPES = mapObject(typedefs, ([dataTypeString, typedef]) => [dataTypeString, generateTypedefFor(parseInt(dataTypeString), typedef, typedef)])


function generateTypedefFor<T extends PropertyType>(dataType: DataType, typedef: Typedef<T | Property<T>>, 
	extendedTypedef: Typedef<any>): FileTypeRegistry {
	
	if (typedef.__parent) {
		return generateTypedefFor(dataType, extendedTypedef.__parent as Typedef<T|Property<T>>, extendedTypedef)
	}
	
	
	let filteredTypedef = filterObject(typedef, ([fieldName]) => !fieldName.startsWith("__"))
	
	const displayName = extendedTypedef.__displayName as string ?? DataType[dataType]
	
	let typedefWithoutMetadata = mapObject(filteredTypedef, ([fieldName, definition]) => [
		fieldName,
		definition instanceof Property ? definition.type : definition,
	])
	
	let unfilteredMetadata = mapObject(filteredTypedef, ([fieldName, definition]) => {
		let description: string | undefined = defaultDescriptions[fieldName]
			?.replaceAll("{type}", displayName)
			?.replaceAll("{type_lowercase}", displayName.toLowerCase())
		
		if (definition instanceof Property && definition.description) {
			definition.description = definition.description?.replaceAll("{standard}", description)
			return [fieldName, definition]
		}
		
		if (!description)
			return [fieldName, definition]
	
		if (typeof definition === 'string')
			return [fieldName, new Property(definition, description)]
		else {
			definition.description = description
			return [fieldName, definition]
		}
	})
	
	
	const { fieldOffsets, size } = generateOffsets(filteredTypedef)
	
	return {
		typedef: typedefWithoutMetadata,
				
		metadata: filterObject(unfilteredMetadata, ([, definition]) => definition instanceof Property) as Typedef<Property<T>>,
				
		fieldOffsets,
		size,
		
		displayName,
		
		// @ts-ignore
		childTypes: extendedTypedef.__childTypes as {[fieldName: string]: DataType} ?? {},
		
		childField: extendedTypedef.__childField as string | undefined,
		
		childFieldLabel: extendedTypedef.__childFieldLabel as string | undefined,
		
		identifyingField: extendedTypedef.__importantField as string ?? "id",
		
		countSymbol: extendedTypedef.__countSymbol as string | undefined,
		
		nestedAllValues: extendedTypedef.__nestedAllValues as boolean ?? false,
		objectType: extendedTypedef.__objectType ?? dataDivisions.main,
		
		entryPoints: extendedTypedef.__entryPoints ?? {},
		
		instantiate(): object {
			let result = {}
			result[VALUE_UUID] = ValueUuid()
			for (const [fieldName, type] of Object.entries(filteredTypedef)) {
				let typeString = type instanceof Property ? type.type : type as string
				result[fieldName] = typeString === "string" || typeString === "symbol"
					? null
					: typeString === "Vector3"
						? Vector3.ZERO
						: typeString === "pointer"
							? Pointer.NULL
							: typeString.startsWith("bool")
								? false
								: 0
			}
			return result
		},
	}
}

		
function generateOffsets(typedef: object) {
	let result = {}
	let offset = 0
	for (const [fieldName, fieldType] of Object.entries(typedef)) {
		result[fieldName] = offset
		result[offset] = fieldName
		offset += {
			string: 8,
			symbol: 8,
			pointer: 8,
			Vector3: 12,
			float: 4,
			double: 8,
			byte: 1,
			bool8: 1,
			short: 2,
			int: 4,
			long: 8,
			bool32: 4,
			// @ts-ignore
		}[typeof fieldType === 'object' ? fieldType.type : fieldType]
		
		if (isNaN(offset)) {
			throw new Error(`Field Offset is NaN, field name: ${fieldName}, field type: ${fieldType}`)
		}
	}

	return { fieldOffsets: result as Typedef<string | number>, size: offset }
}
