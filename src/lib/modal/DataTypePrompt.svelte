<script lang="ts">
	import { DataType } from "$lib/elf/elfBinary";

	import { afterUpdate, beforeUpdate, onMount } from "svelte";
	
	import Alert from "./Alert.svelte";
	import { hideActiveModal } from "./modal";

	export let fileName: string = ""
	
	let select: HTMLSelectElement
	let okButton: HTMLButtonElement
	
	let selectedIndex = 0
	
	let isCompressed = false
	
	const defaultFileNames = {
		"dispos_Npc": DataType.Npc,
		"dispos_Item": DataType.Item,
		"dispos_Mobj": DataType.Mobj,
		"dispos_Aobj": DataType.Aobj,
		"dispos_BShape": DataType.BShape,
		"maplink": DataType.Maplink,
		"dispos_Hand": DataType.Hand,
		"dispos_Hariko": DataType.Hariko,
		"dispos_Hole": DataType.Hole,
		"dispos_Effect": DataType.Effect,
		"dispos_Sobj": DataType.Sobj,
		"dispos_Gobj": DataType.Gobj,
		
		"lobj": DataType.Lobj,
		"resource_Gobj": DataType.ResourceGobj,
		"DigPoint": DataType.DigPoint,
		
		"data_npc": DataType.DataNpc,
		"data_item": DataType.DataItem,
		"data_map": DataType.DataMap,
		"data_hariko": DataType.DataHariko,
		"data_mobj": DataType.DataMobj,
		"data_aobj": DataType.DataAobj,
		
		"data_npc_model": DataType.DataNpcModel,
		"data_item_model": DataType.DataItemModel,
		"data_item_set": DataType.DataItemSet,
		"data_gobj_model": DataType.DataGobjModel,
		"data_hariko_model": DataType.DataHarikoModel,
		"data_navi_model": DataType.DataNaviModel,
		"data_mobj_model": DataType.DataMobjModel,
		"data_player_model": DataType.DataPlayerModel,
		
		"data_btlSet": DataType.DataBtlSet,
		"data_confetti_hole_totalInfo": DataType.DataConfettiTotalHoleInfo,
		"data_effect": DataType.DataEffect,
		"data_mapLinkZoom": DataType.DataMaplinkZoom,
		"data_party": DataType.DataParty,
	}
	
	onMount(() => {
		okButton.disabled = true
		
		select.onchange = function(e) {
			okButton.disabled = select.selectedIndex < 1
		}
		
		for (const [defaultName, type] of Object.entries(defaultFileNames)) {
			if (fileName.indexOf(defaultName) > -1) {
				select.value = DataType[type]
				selectedIndex = select.selectedIndex
				okButton.disabled = false
			}
		}
		
		if (fileName.includes('.zst')) {
			isCompressed = true
		}
	})
	
	beforeUpdate(() => {
		if (select)
			selectedIndex = select.selectedIndex
	})
	
	afterUpdate(() => {
		if (select)
			select.selectedIndex = selectedIndex
	})
</script>

<Alert title="Select data type">
	<select bind:this={select}>
		<option value="invalid">Please select data type</option>
		<option value="Npc">NPC Placement (dispos_Npc)</option>
		<option value="Item">Item Placement (dispos_Item)</option>
		<option value="Mobj">Mobj Placement (dispos_Mobj)</option>
		<option value="Aobj">Aobj Placement (dispos_Aobj)</option>
		<option value="BShape">BShape Placement (dispos_BShape)</option>
		<option value="Maplink">Room Transitions (maplink)</option>
		<option value="Hand">Magic Circles (dispos_Hand)</option>
		<option value="Hariko">Hariko Placement (dispos_Hariko)</option>
		<option value="Hole">Hole Placement (dispos_Hole)</option>
		<option value="Effect">Particle Effect Placement (dispos_Effect)</option>
		<option value="Sobj">Sobj Placement (dispos_Sobj)</option>
		<option value="Gobj">Gobj Placement (dispos_Gobj)</option>
		<option value="Lobj">Lobj Placement (lobj)</option>
		<option value="ResourceGobj">Resource Gobj (resource_Gobj)</option>
		<option value="DigPoint">DigPoint Placement (DigPoint)</option>
		
		<option value="DataNpc">NPC Registry (data_npc)</option>
		<option value="DataItem">Item Registry (data_item)</option>
		<option value="DataMap">Map Registry (data_map)</option>
		<option value="DataHariko">Hariko Registry (data_hariko)</option>
		<option value="DataMobj">Mobj Registry (mobj/data_mobj_*)</option>
		<option value="DataAobj">Aobj Registry (mobj/data_aobj)</option>
		
		<option value="DataNpcModel">NPC Model Registry (data_npc_model)</option>
		<option value="DataItemModel">Item Model Registry (data_item_model)</option>
		<option value="DataItemSet">Item Sets (data_item_set)</option>
		<option value="DataGobjModel">Gobj Model Registry (gobj_model/data_gobj_model_GobjModel)</option>
		<option value="DataHarikoModel">Hariko Model Registry (data_hariko_model)</option>
		<option value="DataNaviModel">Olivia Model Registry (data_navi_model)</option>
		<option value="DataMobjModel">Mobj Model Registry (mobj_model/data_mobj_model_*)</option>
		<option value="DataPlayerModel">Player Model Registry (data_player_model)</option>
		
		<option value="DataBtlSet">Battle Formations (data_btlSet)</option>
		<option value="DataConfettiTotalHoleInfo">Not-bottomless Hole Data (data_confetti_hole_totalInfo)</option>
		<option value="DataEffect">Particle Effect Registry (data_effect)</option>
		<option value="DataMaplinkZoom">data_mapLinkZoom</option>
		<option value="DataParty">Party Member Registry (data_party)</option>
	</select>
	
	<div class="checkbox" style="margin-top: 0.3rem;">
		<input type="checkbox" id="iscompressed" bind:checked={isCompressed}>
		<label for="iscompressed">Is Compressed with ZSTD?</label>
	</div>
	
	<div class="buttons" style="margin-top: 1rem;">
		<button class="modalbtn" on:click={() => hideActiveModal(false)}>Cancel</button>
		<button class="modalbtn" on:click={() => hideActiveModal({
			dataType: DataType[select.options[select.selectedIndex].value],
			isCompressed,
		})} bind:this={okButton}>Okay</button>
	</div>
</Alert>

<style>
	select {
		border: none;
		padding: 6px 12px;
		font-size: var(--alert-font-size);
		min-width: 4rem;
		background: #dcdcdc;
		border-radius: 6px;
		transition: background 0.1s;
	}

	select:hover {
		background: #aeaeae;
	}
	
	label {
		font-size: 13pt;
	}
</style>