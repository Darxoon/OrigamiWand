<script lang="ts">
    import { onMount } from "svelte";

    import Alert from "../modal/Alert.svelte";
    import { hideActiveModal, PopupButtonVariant } from "../modal/modal";
    import StringViewer from "../modal/StringViewer.svelte";
    
    export let title: string
    export let content: string
    export let fontSize = 14
    
    export let buttons: PopupButtonVariant = PopupButtonVariant.YesNo
    export let showCancel = true
    
    let stringViewerElement: HTMLDivElement
    
    onMount(() => {
        stringViewerElement?.focus()
    })
</script>

<Alert title={title} --alert-font-size="{fontSize}pt">
    <div bind:this={stringViewerElement}><StringViewer text={content} /></div>
    
    <div class="buttons">
        {#if buttons == PopupButtonVariant.Okay}
            <button tabindex="0" on:click={() => hideActiveModal(true)}>Okay</button>
        {/if}
        {#if buttons == PopupButtonVariant.YesNo}
            <button tabindex="0" on:click={() => hideActiveModal(true)}>Yes</button>
            <button tabindex="0" on:click={() => hideActiveModal(false)}>No</button>
        {/if}
        {#if showCancel}
            <button tabindex="0" on:click={() => hideActiveModal(null)}>Cancel</button>
        {/if}
    </div>
</Alert>

<style>
    .buttons {
        margin-left: auto;
        user-select: none;
        width: fit-content;
    }
    
    button {
        border: none;
        padding: 6px 12px;
        font-size: var(--alert-font-size);
        min-width: 4rem;
        background: #dcdcdc;
        border-radius: 6px;
        transition: background 0.1s;
    }
    
    button:hover {
        background: #aeaeae;
    }
    
    button:active, button:focus {
        background: #808080;
    }
</style>
