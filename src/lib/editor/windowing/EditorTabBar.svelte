<script lang="ts">
    import { nonnativeButton } from "$lib/nonnativeButton";
    import { clamp, excludeFromArrayPure, insertIntoArrayPure, noop } from "$lib/util";
    import { afterUpdate, createEventDispatcher, onDestroy, onMount } from "svelte";
    import { type Tab, tabWasAccepted, globalDraggedTab } from "../globalDragging";
    import { browser } from "$app/environment";

	export let tabs: Tab[]
	export let activeIndex: number
	export let draggingDetached: boolean
	export let showBugReporter: boolean
	
	const dispatch = createEventDispatcher()
	
	let state: 'default' | 'dragging' | 'draggingDetached' = 'default'
	
	let tabBar: HTMLUListElement
	let tabElements: HTMLLIElement[] = []
	
	let floating: Tab
	let floatingInsertIndex = 0
	let hasFloatingOwnership = false
	
	let afterDetached = false
	let mouseX = 0
	let baseMouseX = 0
	
	$: tabsWithoutFloating = state == 'default' ? tabs : excludeFromArrayPure(tabs, floating)
	$: immediateTabs = state == 'default' ? tabs : state == 'draggingDetached' ? tabsWithoutFloating : insertIntoArrayPure(tabsWithoutFloating, floatingInsertIndex, floating)
	
	$: floatingOverlayX = state == 'dragging' && getOverlayX(mouseX, floatingInsertIndex)
	
	// updating exported variable
	$: draggingDetached = state == 'draggingDetached'
	
	$: console.log('tabbar', floatingInsertIndex)
	
	onMount(() => {
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
		
		// @ts-ignore
		feather.replace()
	})
	
	onDestroy(() => {
		if (browser) {
			document.removeEventListener('mousemove', onMouseMove)
			document.removeEventListener('mouseup', onMouseUp)
		}
	})
	
	afterUpdate(() => {
		if (afterDetached) {
			// @ts-ignore
			feather.replace()
			afterDetached = false
			
			if ($tabWasAccepted) {
				tabs = excludeFromArrayPure(tabs, $tabWasAccepted)
				activeIndex = clamp(activeIndex, 0, tabs.length - 1)
				
				$tabWasAccepted = undefined
			}
		}
	})
	
	function getOverlayX(mouseX: number, floatingInsertIndex: number) {
		let floatingWidth = tabElements[floatingInsertIndex].getBoundingClientRect().width
		let tabBarBounds = tabBar?.getBoundingClientRect()
		
		return clamp(mouseX - baseMouseX, tabBarBounds.x, tabBarBounds.x + tabBarBounds.width - floatingWidth)
	}
	
	function onMouseMove(e: MouseEvent) {
		mouseX = e.clientX
	}
	
	function onMouseUp(e: MouseEvent) {
		if (state == 'default')
			return
		
		if (state == 'draggingDetached') {
			activeIndex = tabs.indexOf(floating)
			floating = undefined
			afterDetached = true
			hasFloatingOwnership = false
			
			state = 'default'
			return
		}
		
		if (state == 'dragging') {
			tabs = [...immediateTabs]
			
			activeIndex = clamp(floatingInsertIndex, 0, tabs.length - 1)
			floating = undefined
			
			if (!hasFloatingOwnership) {
				// global dragging
				// ...
			}
			
			hasFloatingOwnership = false
			
			state = 'default'
			return
		}
	}
	
	function onMouseEnter() {
		if (state == 'draggingDetached') {
			state = 'dragging'
			
			if (hasFloatingOwnership)
				$globalDraggedTab = undefined
		}
	}
	
	function onMouseLeave() {
		if (state == 'dragging') {
			state = 'draggingDetached'
			
			if (hasFloatingOwnership)
				$globalDraggedTab = floating
		}
	}
	
	function onTabMouseDown(tab: Tab, index: number) {
		if (state != 'default')
			return
		
		activeIndex = index
		baseMouseX = mouseX - tabElements[index].getBoundingClientRect().x
		
		floating = tab
		floatingInsertIndex = index
		hasFloatingOwnership = true
		
		state = 'dragging'
	}
	
	function onTabMouseMove(tab: Tab, index: number) {
		if (state != 'dragging' || tab == floating)
			return
		
		let floatingWidth = tabElements[floatingInsertIndex].getBoundingClientRect().width
		let { width: enteredWidth, x } = tabElements[index].getBoundingClientRect()
		
		let minMouseOffset = Math.max(0, enteredWidth - floatingWidth)
		
		if (index > floatingInsertIndex) {
			// tab that is being entered is to the right of floating tab
			if (mouseX - x > minMouseOffset) {
				floatingInsertIndex += 1
			}
		} else {
			// tab that is being entered is to the left of floating tab
			if (x + enteredWidth - mouseX > minMouseOffset) {
				floatingInsertIndex -= 1
			}
		}
		
		activeIndex = floatingInsertIndex
	}
</script>

<ul class="tab_bar" bind:this={tabBar} on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
	{#if showBugReporter}
		<li class:absolute={tabs.length === 0} style="font-weight: 600;">
			<a href="https://github.com/Darxoon/OrigamiWand/issues"
				target="_blank" rel="noopener noreferrer">Report bugs</a>
		</li>
	{/if}
	{#if tabs.length === 0}
		<li class="active" style="margin: 0 auto">Open a file to get started.</li>
	{/if}
	{#if tabs.length != 0 && immediateTabs.length == 0}
		<li>&nbsp</li>
	{/if}
	{#each immediateTabs as tab, i}
		<li bind:this={tabElements[i]} use:nonnativeButton={() => activeIndex = i}
			class:active={activeIndex == i}
			class:colorInvisible={tab == floating}
			on:mousedown={() => onTabMouseDown(tab, i)} 
			on:mousemove={e => onTabMouseMove(tab, i)}>
			
			<span class="tabName">{tab.name}</span>
			<div class="close_button" class:white-x={state == 'default' && activeIndex == i}
				on:mousedown|stopPropagation={noop} use:nonnativeButton={() => dispatch('closeTab', tab)}>
				<i data-feather="x" class="icon-close"></i>
			</div>
		</li>
	{/each}
	
	<li class="dragged_tab_overlay" class:invisible={state != 'dragging'} style="--left: {floatingOverlayX}">
		{floating?.name}
		
		<!-- decoration only -->
		<div class="close_button white-x">
			<i data-feather="x" class="icon-close"></i>
		</div>
	</li>
</ul>

<style lang="scss">
	.tab_bar {
		margin: 0;
		padding: 0 6px 0 0;
		
		list-style-type: none;
		display: flex;
	}
	
	li {
		padding: 10px 16px;
		border-radius: 9px 9px 0 0;
					
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		
		white-space: nowrap;
		
		&.active {
			color: white;
			background: var(--editor-bg);
			transition: background 0.08s;
		}
		
		&.dragged_tab_overlay {
			position: absolute;
			left: calc(var(--left) * 1px);
			
			pointer-events: none;
			
			color: white;
			background: var(--editor-bg);
		}
		
		.tabName {
			white-space: initial;
		}
	}
	
	.close_button {
		position: relative;
		
		border-radius: 4px;
		
		top: 2px;
		
		width: 20px;
		height: 20px;
		float: right;
		
		margin-right: -4px;
		margin-left: 2px;
		
		color: black;
		
		&:hover {
			background: #ffffff4f;
		}
		
		&.white-x {
			color: white;
		}
		
		.icon-close {
			width: 100%;
			height: 100%;
			stroke-width: 2.5px;
		}
	}
	
	.absolute {
		position: absolute;
	}
	
	.colorInvisible {
		opacity: 0;
	}
	
	.invisible {
		display: none;
	}
</style>
