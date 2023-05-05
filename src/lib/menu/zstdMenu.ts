import { compress, decompress, downloadBlob, loadFile } from "../util"

export function getZstdMenu() {
	return {
		title: "Zstd",
		items: [
			{
				name: "Decompress File(s)",
				onClick: decompressFileSelector,
			},
			{
				name: "Compress File(s)",
				onClick: compressFileSelector,
			},
		],
	}
}

function decompressFileSelector() {
	console.log("opening file to decompress")

	const fileSelector = document.createElement('input')
	fileSelector.setAttribute('type', 'file')
	fileSelector.setAttribute('multiple', 'multiple')
	fileSelector.click()
	
	fileSelector.addEventListener('change', async (e: any) => {
		for (const file of e.target.files) {
			const content = await loadFile(file)
			const decompressed = await decompress(content)
			
			const newFileName = file.name.replaceAll('.zstd', '').replaceAll('.zst', '')
			
			console.log('decompressing', file.name, newFileName)
			
			downloadBlob(decompressed, newFileName)
		}
	})
}

function compressFileSelector() {
	console.log("opening file to decompress")

	const fileSelector = document.createElement('input')
	fileSelector.setAttribute('type', 'file')
	fileSelector.setAttribute('multiple', 'multiple')
	fileSelector.click()
	
	fileSelector.addEventListener('change', async (e: any) => {
		for (const file of e.target.files) {
			const content = await loadFile(file)
			const compressed = await compress(content)
			
			console.log('compressing', file.name, file.name + '.zst')
			
			downloadBlob(compressed, file.name + '.zst')
		}
	})
}
