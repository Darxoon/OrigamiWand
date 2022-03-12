<script lang="ts">
	import InputField from "$lib/editor/InputField.svelte";
	import { hexFields, setHexField } from "$lib/editor/viewAsHex";
	import type { DataType, ElfBinary } from "$lib/elf/elfBinary";
	import { FILE_TYPES } from "$lib/elf/fileTypes";
	import StringViewer from "./StringViewer.svelte";

	import TabbedAlert from "./TabbedAlert.svelte"

	export let dataType: DataType
	export let objects: any[]
	export let binary: ElfBinary
	export let fieldName: string
	export let title: string
	
	let hideNulls = false
	
	$: fieldType = FILE_TYPES[dataType].typedef[fieldName]
	$: nestedAllValues = FILE_TYPES[dataType].nestedAllValues
	
	$: console.log('fieldOptionAlert.binary', binary)
</script>

<TabbedAlert title={title} selectedIndex={0} tabNames={nestedAllValues 
		? ["General Information", "All Local Values", "All Global Values"]
		: ["General Information", "All Values"]}>
	<div class="info">
		<div>Name:</div>
		<div class="box field">{fieldName}</div>
		
		<div>Data Type:</div>
		<div class="box">{fieldType}</div>
		
		{#if fieldType == "int" || fieldType == "short" || fieldType == "long" || fieldType == "byte"}
			<div>
				<input type="checkbox" name="viewAsHex" checked={$hexFields[dataType] && $hexFields[dataType][fieldName]} on:change={e => {
					// @ts-ignore
					setHexField(dataType, fieldName, e.target.checked)
				}}>
				<label for="viewAsHex">View as Hexadecimal</label>
			</div>
		{/if}
		
		{#if FILE_TYPES[dataType].metadata[fieldName]?.description}
			<div>Description:</div>
			<div class="box description">
				<StringViewer text={FILE_TYPES[dataType].metadata[fieldName]?.description} nopadding={true} />
			</div>
		{/if}
	</div>
	<div>
		{#if fieldType === "string"}
			<div class="hideNullContainer">
				<input type="checkbox" name="hideNull" on:change={e => {
					// @ts-ignore
					hideNulls = e.target.checked
				}}>
				<label for="hideNull">Hide all "null" values</label>
			</div>
		{/if}
		<div class="allValues local">
			{#each objects as obj, i}
				{#if hideNulls ? obj[fieldName] !== null : true}
					<div class="index">
						{i}
					</div>
					<div class="fieldName">
						{obj[FILE_TYPES[dataType].identifyingField]}
					</div>
					<div class="field">
						<InputField key={fieldName} value={obj[fieldName]} readonly={true} />
					</div>
				{/if}
			{/each}
		</div>
	</div>
	{#if nestedAllValues}
		<div>
			{#if fieldType === "string"}
				<div class="hideNullContainer">
					<input type="checkbox" name="hideNull" on:change={e => {
						// @ts-ignore
						hideNulls = e.target.checked
					}}>
					<label for="hideNull">Hide all "null" values</label>
				</div>
			{/if}
			<div class="allValues nested">
				{#each objects as arr, i}
					{#each arr.objects ?? arr as obj, j}
						{#if hideNulls ? obj[fieldName] !== null : true}
							<div class="index">
								{i}&nbsp;.&nbsp;{j}
							</div>
							<div class="fieldName" class:highlight={j > 0 ? j % 2 == 1 : i % 2 == 1}>
								{obj[FILE_TYPES[dataType].identifyingField]}
							</div>
							<div class="field">
								<InputField key={fieldName} value={obj[fieldName]} readonly={true} />
							</div>
						{/if}
					{/each}
					<div class="filler"></div>
					<div class="filler"></div>
					<div class="filler"></div>
				{/each}
			</div>
		</div>
	{/if}
</TabbedAlert>

<style lang="scss">
	.hideNullContainer {
		margin: 0 0 12px -4px;
	}
	
	.allValues {
		display: grid;
		grid-template-columns: min-content minmax(min-content, 30%) auto;
		max-height: calc(100vh - 18rem);
		min-width: min(48rem, 70vw);
		overflow-y: auto;
	}
	
	.allValues.local :nth-child(6n-1) {
		background: #eaeaea;
		border-radius: 3px;
	}
	
	// .allValues.nested :nth-child(12n-4) {
	// 	background: #eaeaea;
	// 	border-radius: 3px;
	// }
	.allValues.nested .highlight {
		background: #eaeaea;
		border-radius: 3px;
	}
	
	.allValues div {
		margin-bottom: 8px;
	}
	
	.index {
		padding: 3px 0;
		margin-right: 8px;
	}
	
	.fieldName {
		padding: 3px 4px 3px 2px;
		margin-right: 2px;
	}
	
	.field {
		margin-right: 6px;
	}
	
	.box {
		margin: 4px 0 1rem 0;
		padding: 6px 12px;
		
		border-radius: 4px;
		
		background: #eaeaea;
	}
	
	.field {
		font-family: var(--ff-monospace);		
	}
	
	.description {
		padding: 12px 12px;	
		min-height: 5rem;
	}
</style>
