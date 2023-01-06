<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SearchBar from "../search/SearchBar.svelte";
    import type { SearchIndex } from "../search/searchIndex";
	
	export let searchIndex: SearchIndex
	export let searchResults: SearchIndex = undefined
	
	const dispatch = createEventDispatcher()
</script>

<div class="toolbar">
	<div class="card btn" on:click={() => dispatch('add')}>
		<div class="icon"><i data-feather="plus"></i></div>
		<span>Add new Object</span>
	</div>
	<div class="card btn" on:click={() => dispatch('clear')}>
		<div class="icon"><i data-feather="x"></i></div>
		Delete all Objects
	</div>
	<SearchBar index={searchIndex} bind:results={searchResults} />
</div>