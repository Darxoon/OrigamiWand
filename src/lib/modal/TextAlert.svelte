<script lang="ts">
	import Alert from "./Alert.svelte";
	import StringViewer from "./StringViewer.svelte";

	export let title: string
	export let content: string
	export let fontSize = 14
</script>

<div class="wrapper">
	<Alert title={title} --alert-font-size={fontSize + "pt"}>
		<StringViewer text={content} nopadding={true} />
	</Alert>
</div>

<style>
	.wrapper {
		max-width: 48rem;
	}
</style>
