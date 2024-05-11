<script lang="ts">
	import { Pointer } from "paper-mario-elfs/elfBinary";
	import { Vector3 } from "paper-mario-elfs/misc";
	
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher()
	
	export let key: string
	export let value: any
	export let fieldType: string | undefined = undefined
	export let readonly: boolean = false
	export let noSpaces: boolean = false
	export let viewAsHex: boolean = false
	
	let str = ""
	
	let isValueInvalid = false
	
	
	$: updateStr(viewAsHex)
	$: if (!readonly) applyStr(str)
	$: if (!readonly && fieldType == "Vector3") applyStr(vectorStrings[0] + vectorStrings[1] + vectorStrings[2])
	
	let vectorStrings = Array(3).fill("")
	
	
	function updateStr(viewAsHex: boolean) {
		if (value == null)
			str = "null"
		
		else switch (typeof value) {
			case "string":
				str = `"${value}"`
				break
			case "number":
				if (fieldType === "float" && !value.toString().includes('.')) {
					str = value.toString() + '.0'
				} else if ((fieldType == "int" || fieldType == "short" || fieldType == "long" || fieldType == "byte") && viewAsHex) {
					str = '0x' + value.toString(16)
				} else {
					str = value.toString()
				}
				break
			case "object":
				if (value instanceof Vector3) {
					vectorStrings = [
						value.x.toString(),
						value.y.toString(),
						value.z.toString(),
					]
					break
				} else if (value instanceof Pointer) {
					str = value.toString()
					break
				} else if (value instanceof Array) {
					str = value.toString()
					break
				}
			default:
				str = value.toString()
				break
		}
	}
	
	function applyStr(str: string) {
		isValueInvalid = false
		if (str === "") {
			
		} 
		else if (str === "null")
			value = null
		
		else if (value === null || typeof value === 'string') {
			if (str.startsWith('"') && str.endsWith('"'))
				value = str.slice(1, -1)
			else {
				isValueInvalid = true
				value = null
				console.warn(`invalid string '${str}'`)
			}
		} 
		else switch (typeof value) {
			case "number":
				if (str.match(/\./g)?.length > 1 
						|| (str.includes('-') && !str.startsWith('-') 
						|| str.match(/-/g)?.length > 1)) {
					isValueInvalid = true
				} else if (viewAsHex && (fieldType == "int" || fieldType == "short" || fieldType == "long" || fieldType == "byte")) {
					if (str.startsWith('0x'))
						value = parseInt(str.slice(2), 16)
					else
						value = parseInt(str, 16)
				} else {
					value = parseFloat(str)
				}
				break
			case "boolean":
				if (str === 'true' || str === 'false')
					value = str === 'true' ? true : false
				else
					isValueInvalid = true
				break
			case "object":
				if (value instanceof Vector3) {
					value = new Vector3(
						parseFloat(vectorStrings[0]),
						parseFloat(vectorStrings[1]),
						parseFloat(vectorStrings[2]),
					)
					break
				} else if (value instanceof Pointer) {
					value = Pointer.fromString(str)
					break
				} else if (value instanceof Array) {
					// do nothing
					break
				}
				// deliberately no break, to roll over to the exception
			default:
				throw new Error(`Unknown data type ${Object.getPrototypeOf(value)?.constructor?.name}`)
		}
				
		dispatch('valueChanged', {key, value})
	}
	
	function onInput(e: KeyboardEvent) {
		if (e.key === "Enter" && fieldType) {
			console.log('verifying input')
			
			if (isValueInvalid)
				return
			
			verifyInput(fieldType)
		}
		
		switch (fieldType) {
			case "int":
			case "short":
			case "long":
				if (!/[\d-]/.test(e.key))
					e.preventDefault()
				break
			case "long":
				if (!/\d/.test(e.key))
					e.preventDefault()
				break
			case "float":
			case "double":
				if (!/[\d\.-]/.test(e.key))
					e.preventDefault()
				break
			case "string":
			case "symbol":
				if (noSpaces && e.key === " ")
					e.preventDefault()
				break
				
			default:
				break
		}
	}
	
	// fieldType is passed explicitly because Vector3 fields are always "float"
	function verifyInput(fieldType: string) {
		switch (fieldType) {
			case "int": 
			case "long": {
				let value = parseInt(str)
				str = value.toString()
				break
			}
			
			case "byte": {
				let value = parseInt(str) % 256
				str = value.toString()
				break
			}
			
			case "float":
			case "double": {
				let value = parseFloat(str)
				str = value.toString() + (value.toString().includes('.') ? "" : ".0")
				break
			}
		}
	}
</script>

<svelte:options accessors={true} />

<div class="input">
	{#if value instanceof Vector3}
		<label for="x">X</label>
		<input type="number" name="x" bind:value={vectorStrings[0]} disabled={readonly} />
		<label for="y">Y</label>
		<input type="number" name="y" bind:value={vectorStrings[1]} disabled={readonly} />
		<label for="z">Z</label>
		<input type="number" name="z" bind:value={vectorStrings[2]} disabled={readonly} />
	{:else}
		<input bind:value={str} readonly={readonly} on:keypress={onInput} tabindex="0"
			class:str={typeof value === 'string'}
		 	class:null={value === null}
			class:boolean={typeof value === 'boolean'} />
		
		{#if isValueInvalid}
			<span class="invalid-marker">invalid</span>
		{/if}
	{/if}
</div>

<style lang="scss">
	.input {
		position: relative;
		font-family: var(--ff-monospace);
		width: 100%;
		display: flex;
		
		input {
			border: 1px solid #8f8f9d;
			border-radius: 4px;
			padding: 5px 2px 3px 1px;
			margin-left: 2px;
			
			font-family: inherit;
			font-size: 14px;
			
			color: black;
			
			width: 100%;
			
			&.str {
				color: #148210;
			}
			
			&.null {
				color: #e31910;
			}
			
			&.boolean {
				color: #00458e;
			}
		}
		
		.invalid-marker {
			background: yellow;
			
			border-radius: 3px;
			padding: 1px 5px 0 5px;
			
			margin-top: 3px;
			margin-right: 4px;
			
			position: absolute;
			right: 0;
			
			user-select: none;
			-webkit-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
		}
		
		label {
			margin: auto 3px;
			padding: 1px 4px;
			color: white;
			border-radius: 2px;
		}
		
		label[for="x"] {
			background: #e13455;
		}
		label[for="y"] {
			background: #5dae46;
		}
		label[for="z"] {
			background: #3982f4;
		}
	}	
</style>
