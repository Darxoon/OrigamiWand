<script lang="ts">
	import type { DataType } from "paper-mario-elfs/elfBinary";
	import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
	import { showFieldOptionEvent } from "$lib/util/events";
	import { showModal } from "$lib/modal/modal";
	import TextAlert from "$lib/modal/TextAlert.svelte";
	import { toReadableString } from "$lib/util";
	
    export let fieldName: string
	export let dataType: DataType | undefined = undefined
    export let shown: boolean
    
    function showDescription() {
        showModal(TextAlert, {
            title: `${toReadableString(fieldName)}`,
            content: fieldDescription,
        })
    }
    
    $: fieldDescription = FILE_TYPES[dataType].metadata[fieldName]?.description?.trim()
</script>

<div class="buttons" class:shown={shown}>
    <div class="button description" class:hidden={fieldDescription == undefined} on:click={showDescription}>
        <i class="fa fa-info-circle"></i>
    </div>
    
    <div class="button options" on:click={e => showFieldOptionEvent.emit('show', { fieldName, dataType })}>
        <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
    </div>
</div>

<style lang="scss">
    .buttons {
        display: flex;
        
        position: absolute; 
        right: 0; top: 0;
        
        margin: -1px 2px 0 2px;
        visibility: hidden;
        
        &.shown { visibility: visible }
        
        .button {
            margin-left: 8px;
            font-size: 20px;
            color: #b6b8be;
            
            transition: color 0.1s;
            
            &:hover { color: #777a80 }
        }
    }
    
    .hidden {
        visibility: hidden;
    }
</style>

