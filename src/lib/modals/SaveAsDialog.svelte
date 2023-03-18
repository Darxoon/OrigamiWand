<script lang="ts">
    import type { SaveAsDialogResults } from "$lib/menu/fileMenu";
    import Alert from "$lib/modal/Alert.svelte";
    import { hideActiveModal } from "$lib/modal/modal";
	
	export let fileName: string
	export let compressFile: boolean
	let stripFile: boolean
	
	function cancel() {
		hideActiveModal(false)
	}
	
	function download() {
		let results: SaveAsDialogResults = {
			fileName,
			compressFile: compressFile,
			stripFile,
		}
		
		hideActiveModal(results)
	}
</script>

<Alert title="Save File">
	<label class="text-label" for="fileNameInput">File Name:</label>
	<div class="text-container">
		<input id="fileNameInput" class="box textinput" type="text" bind:value={fileName}>
	</div>
	
	<div>
		<input id="isCompressedInput" type="checkbox" bind:checked={compressFile}>
		<label for="isCompressedInput">Compress File</label>
	</div>
	
	<!-- TODO: add compression strength -->
	
	<div>
		<input id="stripFileInput" type="checkbox" bind:checked={stripFile}>
		<label for="stripFileInput">Strip file and insert watermark (may break the file)</label>
	</div>
	
	<div class="buttons">
		<button class="modalbtn" on:click={cancel}>Cancel</button>
		<button class="modalbtn" on:click={download}>Download</button>
	</div>
</Alert>

<style>
	.text-label {
		display: block;
	}
	
	.text-container {
		display: flex;
	}
	
	.textinput {
		flex: 1;
		min-width: 400px;
		font-family: inherit;
		font-size: inherit;
	}
	
	.box {
		margin: 4px 0 1rem 0;
		padding: 6px 12px;
		
		border-radius: 4px;
		
		background: #eaeaea;
	}
	
	.buttons {
		margin-top: 1rem;
		margin-left: auto;
	}
</style>