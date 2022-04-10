<script lang="ts">
	import { DataType } from "$lib/elf/elfBinary";

	import { FILE_TYPES } from "$lib/elf/fileTypes";

	import { showFieldOptionEvent } from "$lib/events";
	import FieldOptionAlert from "$lib/modals/FieldOptionAlert.svelte";
	import { showModal } from "$lib/modal/modal";
	import TernaryPrompt from "$lib/modals/TernaryPrompt.svelte";
	import { loadedAutosave } from "$lib/stores";
	
	import { insertIntoArrayPure, resizeArray, toReadableString } from "$lib/util";
	
	import { createEventDispatcher, onMount } from "svelte";
	import { globalDragEndEvent, globalDraggedTab, wasDraggingGlobally, type Tab } from "./globalDragging";
	
	export let tabs: Tab[] = []
	export let selectedIndex: number = 0
	export let isActive = true
	export let showBugReporter: boolean = false
	
	const dispatch = createEventDispatcher()
	
	let mouseX = 0
	let mouseY = 0
	
	let draggedTab: Tab = undefined
	let draggedTabWidth: number = 0
	
	let baseMouseX = 0
	
	let draggingVertically = false
	let mouseOutside = false
	let startedDragging = false
	
	$: isActive
	
	let tabBar: HTMLUListElement
	let tabElements: HTMLLIElement[] = []
	let draggedTabOverlay: HTMLLIElement
	let draggedTabIndex = 0
	$: draggedSelectedIndex = selectedIndex
	$: tabsBase = tabs
	$: tabsApplied = draggedTab ? insertIntoArrayPure(tabsBase, draggedTabIndex, draggedTab) : [...tabsBase]
	
	$: resizeTabElements(tabsApplied.length)
	$: if (draggedTab) updateDraggedTabOverlay(mouseX)
	
	function resizeTabElements(length: number) {
		tabElements = resizeArray([...tabElements], length, undefined)
	}
	
	function updateDraggedTabOverlay(mouseX: number) {
		let tabBarBounds = tabBar.getBoundingClientRect()
		draggedTabOverlay.style.left = `${Math.max(tabBarBounds.x, Math.min(
			mouseX - baseMouseX, 
			tabBarBounds.x + tabBarBounds.width - draggedTabWidth
		))}px`
	}
	
	let contentElements = []
	
	export function collapseAll() {
		contentElements[selectedIndex].collapseAll()
	}
	
	export function expandAll() {
		contentElements[selectedIndex].expandAll()
	}
	
	export function addTab(tab: Tab) {
		tabs = [...tabs, tab]
		selectedIndex = tabs.length - 1
	}
	
	export function setActive() {
		isActive = true
	}
	
	export function closeTab(index: number) {
		let arr = [...tabs]
		arr.splice(index, 1)
		tabs = arr
		
		if (tabs.length == 0) {
			isActive = false
			dispatch('removeEditor')
			return
		}
		
		if (selectedIndex >= arr.length) {
			selectedIndex = arr.length - 1
		}
	}
	
	function calculateDragging() {
		let tabBarBounds = tabBar.getBoundingClientRect()
		let tabBarCenterY = tabBarBounds.y + tabBarBounds.height * 0.5
		
		draggingVertically = mouseOutside || Math.abs(tabBarCenterY - mouseY) > tabBarBounds.height
	}
	
	function dockMouseUp(isRight: boolean) {
		console.log('mouseUp', isRight)
		
		tabs = [...tabsBase]
		selectedIndex = tabs.length - 1
		draggingVertically = false
		
		dispatch('dockTab', {
			isRight,
			tab: draggedTab,
		})
		
		draggedTab = undefined
	}
	
	onMount(() => {
		showFieldOptionEvent.on('show', ({ fieldName, dataType }) => {
			if (isActive) {
				console.log('tabs', DataType[dataType], selectedIndex, tabs)
				console.log('tabs[selectedIndex]', tabs[selectedIndex])
				
				const { binary } = tabs[selectedIndex].properties
				
				const objects = binary.data.get(FILE_TYPES[dataType].objectType)
				
				showModal(FieldOptionAlert, {
					title: `Field '${toReadableString(fieldName)}'`,
					fieldName,
					
					dataType,
					binary,
					objects,
				})
			}
		})
		
		document.addEventListener('mousedown', e => {
			if (draggedTab == undefined) {
				startedDragging = false
				$wasDraggingGlobally = false
			}
		})
		
		document.addEventListener('mousemove', e => {
			mouseX = e.clientX
			mouseY = e.clientY
			
			if (draggedTab)
				calculateDragging()
		})
	
		document.addEventListener('mouseup', e => {
			if (draggedTab) {
				draggedTab = undefined
				selectedIndex = draggedSelectedIndex
				tabs = mouseOutside ? tabs : [...tabsApplied]
				draggingVertically = false
				
				$wasDraggingGlobally = $wasDraggingGlobally || $globalDraggedTab != undefined
				$globalDraggedTab = undefined
				
				if (selectedIndex >= tabs.length) {
					selectedIndex = tabs.length - 1
				}
				
				if (!mouseOutside) {
					globalDragEndEvent.emit('end', undefined)
				}
			}
		})
		
		globalDragEndEvent.on('end', () => {
			if (startedDragging && $wasDraggingGlobally) {
				console.log('removing element')
				closeTab(selectedIndex)
				
				$wasDraggingGlobally = false
			}
		})
	})
	
	function onMouseLeave(e: MouseEvent) {
		mouseOutside = true
		
		if (draggedTab) {
			globalDraggedTab.set({
				tab: draggedTab,
				width: draggedTabWidth,
			})
			
			calculateDragging()
		}
	}
	
	function onMouseEnter(e: MouseEvent) {
		mouseOutside = false
		
		if ($globalDraggedTab?.tab != draggedTab) {
			const { tab, width } = $globalDraggedTab
			console.log('h')
			initiateDragging(tabs, tab, width, tabsApplied.length)
			tabsApplied = [...tabsApplied, tab]
		}
		
		if (draggedTab) {
			calculateDragging()
		}
	}
	
	function initiateDragging(newTabsBase: Tab[], tab: Tab, tabWidth: number, tabIndex: number) {
		console.log('initiating dragging', tabIndex, tab)
		
		tabsBase = newTabsBase
		draggedSelectedIndex = tabIndex
		
		draggedTabIndex = tabIndex
		draggedTabWidth = tabWidth
		
		draggedTab = tab
	}
</script>

<svelte:options accessors={true} />

<div class="main" class:inactive={!isActive} on:mouseleave={onMouseLeave} on:mouseenter={onMouseEnter}>
	
	<ul class="tab_bar" bind:this={tabBar}>
		{#if showBugReporter}
			<li class:absolute={tabsBase.length === 0} style="font-weight: 600;">
				<a href="https://github.com/Darxoon/OrigamiWand/issues"
					target="_blank" rel="noopener noreferrer">Report bugs</a>
			</li>
		{/if}
		{#if tabsBase.length === 0}
			<li class="active" style="margin: 0 auto">Open a file to get started.</li>
		{/if}
		{#each tabsApplied as tab, i}
			<li bind:this={tabElements[i]} 
				class:active={draggedSelectedIndex == i}
				class:animate_dragging={draggedTab != undefined} 
				class:colorInvisible={draggedTab && draggedTabIndex === i}
				on:mousedown={e => {
					if (draggedTab == undefined) {
						selectedIndex = i
						baseMouseX = mouseX - tabElements[i].getBoundingClientRect().x
						startedDragging = true
						
						let newTabsBase = [...tabs]
						newTabsBase.splice(i, 1)
						
						let tabWidth = tabElements[i].getBoundingClientRect().width
						initiateDragging(newTabsBase, tab, tabWidth, i)
					}
				}} 
				on:click={() => draggedSelectedIndex = i}
				on:mousemove={e => {
					if (draggedTab && draggedTab != tab) {
						// @ts-ignore
						let tabOffset = (e.target.getBoundingClientRect().x > tabElements[draggedTabIndex].getBoundingClientRect().x) ? 1 : -1
						draggedSelectedIndex += tabOffset
						draggedTabIndex += tabOffset
					}
				}}
				>
				
				<span class="tabName">{tab.name}</span>
				<img class="close_button" src={draggedSelectedIndex == i ? "/static/x-button-white.svg" : "/static/x-button.svg"} alt="x" on:mousedown|stopPropagation={() => {}}
					on:click={async () => {
						if (tab.children.length > 0) {
							let result = await showModal(TernaryPrompt, {
								title: "Close all child tabs?",
								content: `
Closing this tab will render all of its child tabs useless.
Do you want to close those too?`,
							})
							
							if (result == null)
								return
							
							if (result == true) {
								// TODO close tabs by id
								
								for (const tabId of tabs[i].children) {
									alert(`(Todo) Closing tab ${tabId.toString()}`)
								}
							}
						}
						
						closeTab(i)
					}}>
			</li>
		{/each}
		
		<li class="dragged_tab_overlay" class:invisible={draggedTab == undefined || draggingVertically} bind:this={draggedTabOverlay}>
			{draggedTab?.name}
			<!-- decoration only --><img class="close_button" src="/static/x-button-white.svg" alt="x">
		</li>
	</ul>
	
	
	<div class="content">
		{#if !$loadedAutosave && tabs.length == 0}
			<p class="loadinglabel">Loading...</p>
		{/if}
		
		{#each tabs as tab, i}
			<div class:invisible={selectedIndex != i}>
				<svelte:component this={tab.component} {...tab.properties} bind:this={contentElements[i]} on:addObject on:delete on:open on:valueChanged />
			</div>
		{/each}
		
		<div class="card dockArea dockLeft" class:hidden={!draggingVertically || tabs.length <= 1 || mouseOutside} on:mouseup|stopPropagation={dockMouseUp.bind(undefined, false)}>
			<img src="/static/down.svg" alt="V">
		</div>
		
		<div class="card dockArea dockRight" class:hidden={!draggingVertically || tabs.length <= 1 || mouseOutside} on:mouseup|stopPropagation={dockMouseUp.bind(undefined, true)}>
			<img src="/static/down.svg" alt="V">
		</div>
	</div>
	
</div>

<style lang="scss">
	:root {
		--selected-tab-height: 6;
		--editor-bg: #3a4d7d;
		--inactive-editor-bg: #2b3141;
	}
	
	.main {
		width: 100%;
		height: 100%;
		
		display: flex;
		flex-direction: column;
		
		&.inactive {
			--editor-bg: var(--inactive-editor-bg);
		}
	}
	
	.tab_bar {
		margin: 0;
		padding: 0 6px 0 0;
		// height: 41px;
		
		list-style-type: none;
		display: flex;
		
		li {
			--border-radius: 9px;
			
			padding: 10px 16px;
			border-radius: var(--border-radius) var(--border-radius) 0 0;
						
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
				left: 0;
				
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
			
			width: 16px;
			height: 16px;
			
			&:hover {
				background: #ffffff4f;
			}
		}
	}
	
	.content {
		position: relative;
		padding: 0 1rem;
		background: var(--editor-bg);
		transition: background 0.08s;
		flex: 1;
		
		.loadinglabel {
			text-align: center;
			font-size: 16pt;
			color: white;
		}
		
		.dockArea {
			background: #dfdfdf;
			cursor: pointer;
			position: absolute;
			top: calc(14vh + 5rem);
			
			--size: 48px;
			
			width: var(--size);
			height: var(--size);
			
			transition: transform 0.3s;
			
			&:hover {
				transform: scale(1.4);
			}
			
			&.hidden {
				transform: scale(0);
				pointer-events: none;
			}
			
			img {
				pointer-events: none;
			}
		}
		
		.dockLeft {
			left: 4rem;
			
			img {
				transform: translateX(-4px) rotateZ(90deg);
			}
		}
		
		.dockRight {
			right: 4rem;
			
			img {
				transform: translateX(4px) rotateZ(-90deg);
			}
		}
	}
	
	.absolute {
		position: absolute;
	}
	
	.invisible {
		display: none;
	}
	
	.colorInvisible {
		opacity: 0;
	}
</style>
