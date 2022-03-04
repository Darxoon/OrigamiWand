<script lang="ts">
	export let text: string
	export let inline: boolean = false
	export let nopadding: boolean = false
	
	type LinkObject = {type: "link", text: string, href: string, newTab: boolean}
	type MarkupObject = {type: "code" | "bold", text: string}
	
	$: paragraphs = text.split('\n\n').map(parseParagraph)
	
	function parseParagraph(paragraph: string) {
		const matches = paragraph.matchAll(/\[(.*?)\]\((@?)(.+?)\)|`(.*?)`|\*\*(.*?)\*\*/g)
		let arr: (string | LinkObject | MarkupObject)[] = []
		let sectionStart = 0
		
		for (const match of matches) {
			const [ content, label, newTabIndicator, href, codeBlockContent, boldContent ] = match
			
			// code block
			if (codeBlockContent) {
				arr.push(paragraph.slice(sectionStart, match.index))
				arr.push({
					type: "code",
					text: codeBlockContent,
				})
				sectionStart = match.index + content.length
			}
			
			// bold
			else if (boldContent) {
				arr.push(paragraph.slice(sectionStart, match.index))
				arr.push({
					type: "bold",
					text: boldContent,
				})
				sectionStart = match.index + content.length
			}
			
			// link
			else if (href) {
				arr.push(paragraph.slice(sectionStart, match.index))
				arr.push({
					type: "link",
					text: label || href,
					href,
					newTab: newTabIndicator !== '@',
				})
				sectionStart = match.index + content.length
			}
		}
		
		if (sectionStart < paragraph.length)
			arr.push(paragraph.slice(sectionStart))
		
		return arr
	}
	
	$: console.log('paragraphs', paragraphs)
</script>

<div class="wrapper" class:nopadding={nopadding}>
	{#each paragraphs as paragraph}
		{#if inline}
			<span>
				{#each paragraph as part}
					{#if typeof part === 'object' && part.type == 'link' && part.newTab}
						<a href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
					{:else if typeof part === 'object' && part.type == 'link'}
						<a href={part.href}>{part.text}</a>
					{:else if typeof part === 'object' && part.type == 'code'}
						<pre>{part.text}</pre>
					{:else if typeof part === 'object' && part.type == 'bold'}
						<strong>{part.text}</strong>
					{:else}
						{part}
					{/if}
				{/each}
			</span>
		{:else}
			<p>
				{#each paragraph as part}
					{#if typeof part === 'object' && part.type == 'link' && part.newTab}
						<a href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
					{:else if typeof part === 'object' && part.type == 'link'}
						<a href={part.href}>{part.text}</a>
					{:else if typeof part === 'object' && part.type == 'code'}
						<pre>{part.text}</pre>
					{:else if typeof part === 'object' && part.type == 'bold'}
						<strong>{part.text}</strong>
					{:else}
						{part}
					{/if}
				{/each}
			</p>
		{/if}
	{/each}
</div>

<style>
	.nopadding p:first-child {
		margin-top: 0;
	}
	
	.nopadding p:last-child {
		margin-bottom: 0;
	}
	
	pre {
		display: inline-block;
		font-family: "Fira Mono";
		font-size: 11pt;
		padding: 0 4px;
		margin: 0;
	}
</style>
