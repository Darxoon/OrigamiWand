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
		else if (output.endsWith(' I') && camelCaseStr[i] === 'd') {
			output += camelCaseStr[i].toUpperCase()
		} else {
			output += camelCaseStr[i]
		}
	}
	
	return output.trim()
}
