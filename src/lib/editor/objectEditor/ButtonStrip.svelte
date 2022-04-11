<script lang="ts">
	import { createEventDispatcher } from "svelte";
	
	const dispatch = createEventDispatcher()
</script>

<div class="buttons">
    <div class="icon duplicate" on:click|stopPropagation={() => {
        dispatch('duplicate')
    }}><i class="fa fa-clone"></i></div>
    <div class="icon delete" on:click|stopPropagation={() => {
        dispatch('delete')
    }}><img src="/static/x-button.svg" alt="x"></div>
</div>

<style>
    .buttons {
        position: absolute;
        display: flex;
        
        top: 0;
        right: 0;
        
        margin-right: 6px;
    }
    
    .icon {
        --size: 18px;
        
        height: var(--size);
        width: var(--size);
        margin-left: 2px;
    }
    
    img {
        margin-top: 2px;
    }
</style>

