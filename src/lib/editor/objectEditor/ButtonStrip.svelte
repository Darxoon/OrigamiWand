<script lang="ts">
	import { createEventDispatcher } from "svelte";
	
	const dispatch = createEventDispatcher()
</script>

<div class="buttons">
    <div class="icon duplicate" on:click|stopPropagation={() => {
        dispatch('duplicate')
    }}><i data-feather="copy"></i></div>
    <div class="icon delete" on:click|stopPropagation={() => {
        dispatch('delete')
    }}><i data-feather="x"></i></div>
</div>

<style>
    .buttons {
        position: absolute;
        display: flex;
        
        top: 0;
        right: 0;
    }
    
    .icon {
        --size: 24px;
        
        height: var(--size);
        width: var(--size);
        margin-left: 2px;
        
        margin-top: -2px;
    }
</style>

