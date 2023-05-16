<script lang="ts">
    import { onDestroy, onMount } from "svelte";
	import { hideActiveModal } from "./modal";
    import { nonnativeButton } from "$lib/nonnativeButton";

	export let title: string

	let alertDiv: HTMLDivElement
	
	function close() {
		hideActiveModal(false)
	}
	
	// TODO: Split into FocusTrapZone
	function getAllFocusable(): HTMLElement[] {
		let focusable: HTMLElement[] = Array.from(alertDiv.querySelectorAll(FOCUSABLE_ELEMENTS.join(', ')))
		focusable.push(...focusable.splice(0, 1))
		
		return focusable
	}
	
	function onKeydown(e: KeyboardEvent) {
		if (e.key == "Escape") {
			e.stopPropagation()
			e.preventDefault()
			close()
			
			return
		}
		
		if (e.key == "Tab") {
			trapFocusKeyboard(e)
			
			return
		}
	}
	
	function trapFocusKeyboard(e: KeyboardEvent) {
		let focusable = getAllFocusable()
			
		if (!(document.activeElement instanceof HTMLElement) || focusable.length == 0)
			return
		
		let index = focusable.indexOf(document.activeElement)
		
		if (!e.shiftKey) {
			switch (index) {
				case -1:
					focusable[0].focus()
					break
				case 0:
					if (focusable.length == 1)
						focusable[0].focus()
					else
						return
					break
				// last element is x button, which is the first element on page
				// that's why navigating there has to be implemented but not navigating from there
				case focusable.length - 2:
					focusable[focusable.length - 1].focus()
					break
				// Return so that the event will not be marked as handled
				default:
					return
			}
		} else {
			switch (index) {
				case -1: {
					let lastPossible = focusable[focusable.length - 2] ?? focusable[focusable.length - 1]
					lastPossible.focus()
				} break
				case focusable.length - 1:
					if (focusable.length == 1)
						focusable[0].focus()
					else
						focusable[focusable.length - 2].focus()
					break
				default:
					return
			}
		}
		
		// if it has not returned, then that means that the event has been handled
		e.preventDefault()
		e.stopPropagation()
	}
	
	onMount(() => {
		// @ts-ignore
		feather.replace()
		
		let focusable = getAllFocusable()
		
		if (focusable.length > 0)
			focusable[0].focus()
		
		document.addEventListener('keydown', onKeydown)
	})
	
	onDestroy(() => {
		document.removeEventListener('keydown', onKeydown)
	})
	
	// credit: https://github.com/ghosh/Micromodal/blob/master/lib/src/index.js#L4
	// https://github.com/ghosh/Micromodal/blob/master/LICENSE.md
	const FOCUSABLE_ELEMENTS = [
		'a[href]',
		'area[href]',
		'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
		'select:not([disabled]):not([aria-hidden])',
		'textarea:not([disabled]):not([aria-hidden])',
		'button:not([disabled]):not([aria-hidden])',
		'iframe',
		'object',
		'embed',
		'[contenteditable]',
		'[tabindex]:not([tabindex^="-"])'
	]
</script>

<!-- pre and post elements are for focus trapping, any focus on them will immediately be revoked again -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div class="alert-pre" tabindex="0"></div>

<div class="alert" bind:this={alertDiv}>
	<div class="closeButton" use:nonnativeButton={close}>
		<i data-feather="x"></i>
	</div>
	
	<h2>{title}</h2>
	<div>
		<slot />
	</div>
</div>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div class="alert-post" tabindex="0"></div>

<style>
	:root {
		--alert-font-size: 12pt;
	}
	
	.alert {
		position: relative;
		font-size: var(--alert-font-size);
	}
	
	.closeButton {
		position: absolute;
		right: 0;
	}
	
	h2 {
		margin-top: 0;
		margin-right: 2rem;
	}	
</style>
