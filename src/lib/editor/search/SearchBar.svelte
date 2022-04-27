<script lang="ts">
    import fuzzysort from "fuzzysort"
    import type { IndexValue, SearchIndex } from "./searchIndex";
    
    export let index: SearchIndex
    export let searchTerm: string = ""
    
    export let results: SearchIndex = undefined
    
    $: results = searchTerm ? sort(searchTerm, index) : undefined
    
    function sort(searchTerm, index) {
        const results = fuzzysort.go<IndexValue>(searchTerm, index, {key: 'value'})
        return results.map(result => result.obj)
    }
    
	let searchInput: HTMLInputElement
</script>

<div class="card search" on:click={() => searchInput.click()}>
    <label for="searchInput"><i class="fa fa-search" aria-hidden="true"></i></label>
    &nbsp;
    <input type="text" class="input" id="searchInput" placeholder="Search" size="1"
        bind:this={searchInput} bind:value={searchTerm}>
</div>

<style lang="scss">
    .search {
        flex: 1;
        cursor: text;
        
        display: flex;
        padding: 0 12px;
        
    }
    
    .search:hover {
        background: #d2d2d2;
    }

    label {
        cursor: text;
        padding: 12px 0;
        
        height: min-content;
        margin: auto 0;
    }

    .input {
        flex: 1;
        
        border: 0;
        padding: 0;
        
        outline: none;
        background: none;
        
        font-size: inherit;
        font-family: inherit;
        
        &::placeholder {
            color: black;
            font: inherit;
            opacity: 1;
        }
        
        &:focus::placeholder {
            opacity: 0;
        }
    }
</style>

