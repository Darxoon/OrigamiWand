import { ZstdCodec } from "zstd-codec"

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

export function loadFile(file: File): Promise<ArrayBuffer> {
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
			resolve(simple.compress(new Uint8Array(buffer)).buffer)
		})
	})
}

export function insertIntoArrayPure<T>(arr: T[], index: number, ...items: T[]) {
	let newArr = [...arr]
	newArr.splice(index, 0, ...items)
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

export function toReadableString(camelCaseStr: string) {
	if (camelCaseStr.startsWith('field_'))
		return camelCaseStr.replace('_', ' ')
	
	let output = ""
	
	for (let i = 0; i < camelCaseStr.length; i++) {
		const newWordBeginning: boolean = camelCaseStr[i].toUpperCase() === camelCaseStr[i] || output === ''
		if (newWordBeginning && output.endsWith(' B')) {
			output += camelCaseStr[i].toUpperCase()
		}
		else if (newWordBeginning) {
			output += ' ' + camelCaseStr[i].toUpperCase()
		} 
		// special case for word "ID"
		else if (output.endsWith(' I') && camelCaseStr[i] === 'd' && !(/^[a-z]$/.test(camelCaseStr[i + 1]))) {
			output += camelCaseStr[i].toUpperCase()
		} else {
			output += camelCaseStr[i]
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
