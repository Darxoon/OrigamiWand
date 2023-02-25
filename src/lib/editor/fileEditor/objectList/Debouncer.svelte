<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
	
	export let autoStart = false
	export let requiredDelaySeconds = 10
	
	const dispatch = createEventDispatcher()
	
	let currentTimeoutId: number
	
	export function reset() {
		if (currentTimeoutId) {
			clearTimeout(currentTimeoutId)
		}
		
		// @ts-ignore
		let timeoutId: number = setTimeout(finish, requiredDelaySeconds * 1000)
		currentTimeoutId = timeoutId
	}
	
	export function isRunning() {
		return currentTimeoutId != undefined
	}
	
	function finish() {
		currentTimeoutId = null
		dispatch('finished')
	}
	
	onMount(() => {
		if (autoStart) {
			reset()
		}
	})
	
</script>
