import { DataType, ElfBinary } from "paper-mario-elfs/elfBinary"
import { ZstdCodec } from "zstd-codec"
import type { Tab } from "./editor/globalDragging"
import CardListEditor from "./editor/fileEditor/CardListEditor.svelte"

export function noop() {}

// credit: https://github.com/ghosh/Micromodal/blob/master/lib/src/index.js#L4
// https://github.com/ghosh/Micromodal/blob/master/LICENSE.md
export const HTML_FOCUSABLE_ELEMENTS = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'.tabbable',
	'[tabindex]:not([tabindex^="-"])'
] as const

export function openBlob(): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const fileSelector = document.createElement('input')
		fileSelector.setAttribute('type', 'file')
		fileSelector.click()
		
		fileSelector.addEventListener('change', (e: any) => {
			const file: File = e.target.files[0]
			
			const fileReader = new FileReader()
			
			fileReader.onload = function(e) {
				resolve(fileReader.result as ArrayBuffer)
			}
			
			fileReader.onerror = function(e) {
				reject(e)
			}
			
			fileReader.readAsArrayBuffer(file)
		})
	})
}

export function downloadBlob(data: Uint8Array | BlobPart, fileName: string, mimeType: string = 'application/octet-stream') {
	let blob = new Blob([data], {
		type: mimeType
	});
	let url = window.URL.createObjectURL(blob);
	downloadURL(url, fileName);
	setTimeout(function () {
		return window.URL.revokeObjectURL(url);
	}, 1000);
};

export function getFileContent(file: File): Promise<ArrayBuffer> {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		const fileReader = new FileReader()
		
		fileReader.onload = function(e) {
			console.log(fileReader.result)
			
			resolve(fileReader.result as ArrayBuffer)
		}

		fileReader.onerror = function(e) {
			reject(e)
		}
		
		fileReader.readAsArrayBuffer(file)
	})
}

function downloadURL(url: string, fileName: string) {
	console.log('downloading', url)
	
	let a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.style.display = 'none';
	a.click();
	a.remove();
};

export function decompress(buffer: ArrayBuffer): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		ZstdCodec.run(zstd => {
			const simple = new zstd.Simple();
			
			resolve(simple.decompress(new Uint8Array(buffer)).buffer)
		})
	})
}

export function compress(buffer: ArrayBuffer) {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		ZstdCodec.run(zstd => {
			let simple = new zstd.Simple()
			
			console.log('compressing file with size of', buffer.byteLength)
			resolve(simple.compress(new Uint8Array(buffer), 5).buffer)
		})
	})
}

const nonStandardDataTypes = new Set([
	DataType.DataConfettiTotalHoleInfo,
	DataType.DataUi,
	DataType.DataBtl,
])

export function createFileTab(fileName: string, binary: ElfBinary, dataType: DataType, isCompressed: boolean): Tab {
	let isNonStandard = nonStandardDataTypes.has(dataType)
	
	let properties: any = {
		binary,
		dataType,
	}
	
	if (isNonStandard)
		properties.fileName = fileName
	
	return {
		id: Symbol(),
		name: fileName,
		component: CardListEditor,
		children: [],
		isCompressed,
		binary,
		properties,
	}
}

export function insertIntoArrayPure<T>(arr: T[], index: number, ...items: T[]) {
	let newArr = [...arr]
	newArr.splice(index, 0, ...items)
	return newArr
}

export function excludeFromArrayPure<T>(arr: T[], toExclude: T): T[] {
	let newArr = [...arr]
	let index = arr.indexOf(toExclude)
	
	if (index != -1) {
		newArr.splice(index, 1)
	}
	
	return newArr
}

export function replaceInArrayPure<T>(arr: T[], source: T, replaceWith: T): T[] {
	let newArr = [...arr]
	let index = arr.indexOf(source)
	
	if (index == -1) {
		console.error("Item", source, "was not found in array", arr)
		return newArr
	}
	
	newArr[index] = replaceWith
	return newArr
}

export function resizeArray<T>(arr: T[], newSize: number, defaultValue: T) {
    while(newSize > arr.length)
        arr.push(defaultValue);
    arr.length = newSize;
	
	return arr
}

export function map2d<T,U>(arr: T[][], fn: (value: T, index: number, array: T[]) => U): U[][] {
	return arr.map(arr2 => arr2.map(fn))
}

export function clamp(n: number, minimum: number, maximum: number): number {
	if (n < minimum)
		return minimum
	else if (maximum < n)
		return maximum
	else
		return n
}

export function toReadableString(camelCaseStr: string) {
	if (camelCaseStr.startsWith('field_'))
		return camelCaseStr.replace('_', ' ')
	
	let output = ""
	
	for (let i = 0; i < camelCaseStr.length; i++) {
		const previousChar = camelCaseStr[i - 1]
		const currentChar = camelCaseStr[i]
		const lookAhead = camelCaseStr[i + 1]
		
		const isNumber = /^\d$/.test(currentChar)
		const newWordBeginning: boolean = currentChar.toUpperCase() === currentChar || output === ''
		
		// special case for BShapes
		if (newWordBeginning && output.endsWith(' B')) {
			output += currentChar.toUpperCase()
		}
		// special case for word "ID"
		else if (output.endsWith(' I') && currentChar === 'd' && !(/^[a-z]$/.test(lookAhead))) {
			output += currentChar.toUpperCase()
		}
		else if (isNumber && /^\d$/.test(previousChar)) {
			output += currentChar
		}
		else if (newWordBeginning) {
			output += ' ' + currentChar.toUpperCase()
		} 
		else {
			output += currentChar
		}
	}
	
	return output.trim()
}

export function trimStr(str: string, ch: string) {
    var start = 0, 
        end = str.length;

    while(start < end && str[start] === ch)
        ++start;

    while(end > start && str[end - 1] === ch)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}

export function arrayLastElement<T>(arr: T[]): T {
	return arr[arr.length - 1]
}
