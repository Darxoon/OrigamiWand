<script lang="ts">
	import InnerParagraphDisplay from "./StringViewer/InnerParagraphDisplay.svelte"

	export let text: string
	export let inline: boolean = false
	export let nopadding: boolean = false
	
	type LinkObject = {type: "link", text: string, href: string, newTab: boolean}
	type MarkupObject = {type: "code" | "bold", text: string}
	type BulletObject = {type: "bullet", text: string}
	
	type TextSlice = string | LinkObject | MarkupObject | BulletObject
	
	$: paragraphs = text.split(/(?:\n+[ \t]*(?=\* ))|(?:\n\n+)/g).map(parseParagraph)
	
	function parseParagraph(paragraph: string) {
		const matches = paragraph.matchAll(/\[(.*?)\]\((@?)(.+?)\)|`(.*?)`|\*\*(.*?)\*\*/g)
		let arr: TextSlice[] = []
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
	
	function removeBulletStar(paragraph: TextSlice[]) {
		let firstParagraph = typeof paragraph[0] === 'string'
				? paragraph[0].trimStart().slice(2)
				: paragraph[0]
		return [firstParagraph, ...paragraph.slice(1)]
	}
	
	$: console.log('paragraphs', paragraphs)
</script>

<div class="wrapper" class:nopadding={nopadding}>
	{#each paragraphs as paragraph}
		{#if typeof paragraph[0] === 'string' && paragraph[0].trimStart().includes('* ')}
			<li>
				<InnerParagraphDisplay paragraph={removeBulletStar(paragraph)} />
			</li>
		{:else if inline}
			<span>
				<InnerParagraphDisplay paragraph={paragraph} />
			</span>
		{:else}
			<p>
				<InnerParagraphDisplay paragraph={paragraph} />
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
	
	li {
		margin-left: 1.4rem;
	}
</style>
