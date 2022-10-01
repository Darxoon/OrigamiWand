<script lang="ts">
	import { afterUpdate, onMount } from "svelte";

	import EditorWindow from "./EditorWindow.svelte";
	import type { Tab } from "./globalDragging";
	import type { SaveFile } from "$lib/save/autosave";

	let tabs: Tab[][] = [[]]
	let selectedTabs = [0]
	let activeEditor: number =  0
	
	let editorWindows: EditorWindow[] = []
	
	let isWide = false
	
	onMount(() => {
		let mediaQuery = window.matchMedia("(min-width: 1000px)")
		mediaQuery.addEventListener('change', e => {
			isWide = e.matches
		})
		
		isWide = mediaQuery.matches
	})
	
	let afterUpdateHandlers: Function[] = []
	let tabToAdd: Tab
	let tabToAddEditorIndex = 0
	
	afterUpdate(() => {
		if (tabToAdd) {
			editorWindows[tabToAddEditorIndex].addTab(tabToAdd)
			activeEditor = tabToAddEditorIndex
			tabToAdd = null
		}
		
		afterUpdateHandlers.forEach(fn => fn())
		afterUpdateHandlers = []
	})
	
	export function load(newTabs: Tab[][]) {
		tabs = newTabs
	}
	
	export function collapseAll() {
		editorWindows[activeEditor].collapseAll()
	}

	export function expandAll() {
		editorWindows[activeEditor].expandAll()
	}
	
	export function reset() {
		tabs = [[]]
		selectedTabs = [0]
	}
	
	export function appendTab(tab: Tab) {
		selectedTabs[0] = tabs[0].length
		
		tabs[0] = [
			...tabs[0],
			tab
		]
	}
	
	export function activeTab(): Tab {
		return tabs[activeEditor][selectedTabs[activeEditor]]
	}
	
	export function serialize(serializer: (dataType, binary) => any) {
		return tabs.map(currentTabs => {
			const serializedTabs = currentTabs.flatMap<SaveFile>(tab => {
				const { dataType, binary } = tab.properties
				
				return tab.parentId ? [] : {
					name: tab.name,
					dataType,
					isCompressed: tab.isCompressed,
					content: serializer(dataType, binary),
				}
			})
			return serializedTabs
		})
	}
</script>

<div class="editors">
	{#each tabs as tabList, i}
		<div on:mousedown|capture={e => activeEditor = i}>
			<EditorWindow isActive={activeEditor == i} showBugReporter={i == 0}
				bind:this={editorWindows[i]} bind:selectedIndex={selectedTabs[i]} bind:tabs={tabList} 
				on:removeEditor={e => {
					if (tabs.length > 1) {
						editorWindows[i].setActive()
						let newTabs = [...tabs]
						newTabs.splice(i, 1)
						tabs = newTabs
					} else {
						editorWindows[0]?.setActive()
					}
				}}
				on:delete={e => {
					let index = e.detail.index
					if (typeof index === 'undefined') {
						tabList[selectedTabs[i]].properties.objects.length = 0
						tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
					} else {
						tabList[selectedTabs[i]].properties.objects.splice(e.detail.index, 1)
						tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
					}
				}}
				on:addObject={e => {
					let obj = e.detail.obj
					if (typeof e.detail.index !== "undefined") {
						// we have to mutate the original array here, because that is directly linked with the ElfBinary
						tabList[selectedTabs[i]].properties.objects.splice(e.detail.index, 0, obj)
						tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
					} else {
						tabList[selectedTabs[i]].properties.objects.push(obj)
						tabList[selectedTabs[i]].properties.objects = tabList[selectedTabs[i]].properties.objects
					}
				}}
				on:dockTab={e => {
					let { tab, isRight } = e.detail
					tabs.splice(isRight ? i + 1 : i, 0, [tab])
					tabs = tabs
				}}
				on:open={e => {
					if (e.detail.type === "window") {
						const { title, shortTitle, component, properties, isCompressed } = e.detail
						
						const childID = Symbol(`Tab ID ${title}`)
						
						tabList[selectedTabs[i]].children.push(childID)
						
						const parentId = tabList[selectedTabs[i]].id
						
						if (isWide) {
							if (tabs.length < 2) {
								tabs = [...tabs, []]
							}
							
							tabToAddEditorIndex = 1
							
							tabToAdd = {
								id: childID,
								parentId,
								name: title,
								shortName: shortTitle,
								component,
								properties,
								isCompressed: isCompressed ?? false,
								children: [],
							}
						} else {
							editorWindows[0].addTab({
								id: childID,
								parentId,
								name: title,
								shortName: shortTitle,
								component,
								properties,
								isCompressed: isCompressed ?? false,
								children: [],
							})
						}
					} else
						throw new Error(`Can't open ${JSON.stringify(e.detail.type)}, unknown type`)
				}}
				
				on:valueChanged={e => {
					console.log('valueChanged', e)
				}}
			/>
		</div>
	{/each}
</div>

<style lang="scss">
	.editors {
		flex: 1;
		
		display: flex;
		flex-direction: row;
		
		div {
			flex: 1;
		}
	}
</style>
