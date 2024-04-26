<script lang="ts">
    import { onMount } from "svelte";

    let dontShowAgain: boolean
    let checkboxId = "dontShow-" + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    
    onMount(() => {
		dontShowAgain = !!parseInt(localStorage.getItem('hide-welcome-screen'))
    })
    
    $: if (dontShowAgain != undefined)
        localStorage.setItem('hide-welcome-screen', dontShowAgain ? "1" : "0")
</script>

<div class="welcome-wrapper">
    <div class="welcome">
        <h1>Welcome to Origami Wand</h1>
        
        <div class="welcome-content">
            <h2>Getting Started</h2>
            
            <ul>
                <li><a href="https://github.com/Darxoon/OrigamiWand#usage">Read the introduction</a></li>
                <li><a href="https://docs.google.com/spreadsheets/d/1n5Y-fE2lAtEFBWkpXFYqbb6iKa4cqEIj2pGoXztAuRw/"
                    target="_blank" rel="noopener noreferrer">Visit the ""documentation"" (TOK Spreadsheet)</a></li>
                <li><a href="https://discord.gg/y7qfTKyhZy" target="_blank" rel="noopener noreferrer">Join the TOK Refolded discord</a></li>
                <li>Open a file with File > Open</li>
            </ul>
            
            <input type="checkbox" id={checkboxId} bind:checked={dontShowAgain}>
            <label for={checkboxId}>Do not show again</label>
            
            <p>(This page can always be reopened with Help > Open welcome screen)</p>
        </div>
    </div>
</div>

<style>
    .welcome {
        margin: 2rem auto 0 auto;
        width: fit-content;
        max-width: 40rem;
        color: white;
        text-shadow: 0 2px 8px #000000db;
    }
    
    .welcome-content {
        margin: 0 auto;
        width: fit-content;
    }
    
    input[type=checkbox] {
        box-shadow: 0 2px 8px #0000003b;
        margin-top: 1rem;
    }
    
    h1, h2 {
        text-shadow: 0 2px 8px #0000006e;
    }
    
    :link {
        color: #53BFFF;
    }
    :visited {
        color: #A84FF2;
    }
</style>
