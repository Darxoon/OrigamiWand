<script lang="ts">
	import { globalDraggedTab, tabWasAccepted, type Tab, type DockDirection } from "$lib/editor/globalDragging";
	import TernaryPrompt from "$lib/modals/TernaryPrompt.svelte";
	import { showModal } from "$lib/modal/modal";
	import { globalEditorStrip, loadedAutosave } from "$lib/stores";
    import EditorTabBar from "./EditorTabBar.svelte";
	
	import { createEventDispatcher } from "svelte";
	
	export let tabs: Tab[] = []
	export let selectedIndex: number = 0
	export let isActive = true
	export let showBugReporter: boolean = false
	export let debugIndex: number
	
	const dispatch = createEventDispatcher()
	
	let mouseOutside = false
	let disableSideDocking = false
	
	let contentElements = []
	
	$: dockAreaShown = !mouseOutside && $globalDraggedTab != undefined
	
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
	
	function onMouseLeave(e: MouseEvent) {
		mouseOutside = true
	}
	
	function onMouseEnter(e: MouseEvent) {
		mouseOutside = false
	}
	
	function onDockMouseUp(direction: DockDirection) {
		$tabWasAccepted = $globalDraggedTab.tab
		
		dispatch('dockTab', {
			direction,
			tab: $globalDraggedTab,
		})
		
		$globalDraggedTab = undefined
	}
	
	async function closeTabPrompt(tab: Tab) {
		let tabChildren: Tab[] = []
		
		for (const childId of tab.children) {
			let child = $globalEditorStrip.getTab(childId)
			
			if (child)
				tabChildren.push(child)
		}
		
		if (tabChildren.length > 0) {
			let result = await showModal(TernaryPrompt, {
				title: "Close all child tabs?",
				content: `
Closing this tab will render all of its child tabs useless.
Do you want to close those too?`,
			})
			
			if (result == null)
				return
			
			if (result == true) {
				for (const tab of tabChildren) {
					$globalEditorStrip.closeTab(tab, true)
				}
			}
		}
		
		let tabIndex = tabs.indexOf(tab)
		
		if (tabIndex == -1)
			throw new Error("Tab to be removed is not in the editor window.")
		
		closeTab(tabIndex)
	}
</script>

<svelte:options accessors={true} />

<div class="main" class:inactive={!isActive} on:mouseleave={onMouseLeave} on:mouseenter={onMouseEnter}>
	
	<EditorTabBar bind:tabs={tabs} bind:activeIndex={selectedIndex} bind:disableSideDocking={disableSideDocking}
		showBugReporter={showBugReporter} debugIndex={debugIndex} on:closeTab={e => closeTabPrompt(e.detail)} />
	
	<div class="content">
		{#if !$loadedAutosave && tabs.length == 0}
			<p class="loadinglabel">Loading...</p>
		{/if}
		
		{#each tabs as tab, i}
			<div class:invisible={selectedIndex != i}>
				<svelte:component this={tab.component} {...tab.properties} bind:this={contentElements[i]} on:open on:valueChanged />
			</div>
		{/each}
		
		<div class="card dockArea dockLeft" on:mouseup={() => onDockMouseUp('left')}
			class:hidden={!dockAreaShown || disableSideDocking}>
			
			<i data-feather="chevron-left" class="icon-dock"></i>
		</div>
		
		<div class="card dockArea dockRight" on:mouseup={() => onDockMouseUp('right')}
			class:hidden={!dockAreaShown || disableSideDocking}>
			
			<i data-feather="chevron-right" class="icon-dock"></i>
		</div>
		
		<div class="card dockArea dockUp" on:mouseup={() => onDockMouseUp('origin')}
			class:hidden={!dockAreaShown || tabs.includes($globalDraggedTab.tab)}>
			
			<i data-feather="chevron-up" class="icon-dock"></i>
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
			--translate-x: 0;
			
			background: #61697c;
			color: white;
			cursor: pointer;
			
			position: absolute;
			top: calc(14vh + 5rem);
			
			width: 48px;
			height: 48px;
			
			transition: transform 0.3s;
			transform: translateX(var(--translate-x));
			
			&:hover {
				transform: translateX(var(--translate-x)) scale(1.4);
			}
			
			&.hidden {
				transform: translateX(var(--translate-x)) scale(0);
				pointer-events: none;
			}
			
			.icon-dock {
				width: 100%;
				height: 100%;
			}
		}
		
		.dockLeft {
			left: 4rem;
		}
		
		.dockRight {
			right: 4rem;
		}
		
		.dockUp {
			left: 50%;
			top: 0.7rem;
			
			--translate-x: -50%;
		}
	}
	
	.invisible {
		display: none;
	}
</style>
