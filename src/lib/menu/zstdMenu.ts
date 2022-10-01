import { compress, decompress, downloadBlob, loadFile } from "../util"

export function getZstdMenu() {
	return {
		title: "Zstd",
		items: [
			{
				name: "Decompress File",
				onClick: decompressFileSelector,
			},
			{
				name: "Compress File",
				onClick: compressFileSelector,
			},
		],
	}
}

function decompressFileSelector() {
	console.log("opening file to decompress")

	const fileSelector = document.createElement('input')
	fileSelector.setAttribute('type', 'file')
	fileSelector.click()
	
	fileSelector.addEventListener('change', async (e: any) => {
		const file: File = e.target.files[0]
		
		const content = await loadFile(file)
		const decompressed = await decompress(content)
		
		const newFileName = file.name.replaceAll('.zstd', '').replaceAll('.zst', '')
		
		console.log('decompressing', file.name, newFileName)
		
		downloadBlob(decompressed, newFileName)
		
	})
}

function compressFileSelector() {
	console.log("opening file to decompress")

	const fileSelector = document.createElement('input')
	fileSelector.setAttribute('type', 'file')
	fileSelector.click()
	
	fileSelector.addEventListener('change', async (e: any) => {
		const file: File = e.target.files[0]
		
		const content = await loadFile(file)
		const compressed = await compress(content)
		
		console.log('compressing', file.name, file.name + '.zst')
		
		downloadBlob(compressed, file.name + '.zst')
		
	})
}
