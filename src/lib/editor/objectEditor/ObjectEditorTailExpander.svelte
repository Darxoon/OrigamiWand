<script lang="ts">
    import { toReadableString } from "$lib/util";
    import type { DataType, ElfBinary } from "paper-mario-elfs/elfBinary";
    import { FILE_TYPES } from "paper-mario-elfs/fileTypes";
    import { afterUpdate } from "svelte";
    import ObjectEditor from "./ObjectEditor.svelte";

	export let dataType: DataType
	export let visible: boolean
	export let child: any
	export let binary: ElfBinary = undefined
	
	$: console.log('child', child)
	$: console.log('childContent', childContent)
	
	let isOpen: boolean = false
	let replace = false
		
	$: childField = FILE_TYPES[dataType].childField ?? undefined
	$: childFieldLabel = FILE_TYPES[dataType].childFieldLabel ?? undefined
	
	$: childContent = "children" in child ? child.children : "item" in child ? child.item : child
	
	
	$: childDataType = dataType ? FILE_TYPES[dataType].childTypes[childField] : undefined
	
	$: if (isOpen) replace = true
	
	// TODO: do this in ObjectEditor instead and disable it while loading a file for loading times
	afterUpdate(() => {
		if (replace) {
			// @ts-ignore
			feather.replace()
			replace = false
		}
	})
</script>

	<div class="child_container" class:invisible={!visible}>
		<div class="showChildren" on:click={e => isOpen = !isOpen}>
			<div class:rotated={isOpen}>
				<i data-feather="chevron-down" class="icon-children-arrow"></i>
			</div>
			<span>{toReadableString(childFieldLabel ?? childField)}</span>
		</div>
		{#if isOpen}
			<div class="children">
				{#if childContent instanceof Array}
					{#each childContent as child2, i}
						<ObjectEditor title={`${FILE_TYPES[childDataType].displayName} ${i}`
							+ (child2[FILE_TYPES[dataType].identifyingField] ? `: ${child2[FILE_TYPES[dataType].identifyingField]}` : "")}
							dataType={childDataType} obj={child2} />
					{/each}
				{:else}
					<ObjectEditor dataType={childDataType} obj={childContent} title={`${FILE_TYPES[childDataType].displayName}`
						+ (childContent[FILE_TYPES[dataType].identifyingField] 
							? `: ${childContent[FILE_TYPES[dataType].identifyingField]}` 
							: "")
						} open={true} binary={binary} />
				{/if}
			</div>
		{/if}
	</div>

<style lang="scss">
	:root {
		--bg-label-highlight: #eaeaea;
	}
	
	.child_container {
		margin-top: 0.3em;
		
		.showChildren {
			display: flex;
			
			font-size: 20px;
			cursor: pointer;
			user-select: none;
			
			div {
				width: 29px;
				height: 29px;
			}
			
			.rotated {
				transform: rotate(180deg);
			}
			
			.icon-children-arrow {
				width: 29px;
				height: 29px;
				stroke-width: 1.8px;
			}
		}
	}
	
	.invisible {
		display: none;
	}
</style>

