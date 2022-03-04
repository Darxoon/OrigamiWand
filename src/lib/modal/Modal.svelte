<script lang="ts">
	
</script>

<div class="modal">
	<div class="contentWrapper">
		<div class="content">
			<slot />
		</div>
	</div>
</div>

<style lang="scss">
	.modal {
		display: flex;
		position: fixed;
		left: 0;
		top: 0;
		
		background: #000000a3;
		width: 100%;
		height: 100%;
		
		max-height: 100vh;
		overflow-y: auto;
	}
	
	.contentWrapper {
		display: flex;
		margin: 2rem;
		width: calc(100% - 4rem);
		height: calc(100% - 4rem);
	}	
	
	.content {
		margin: auto;
		padding: 1.5rem;
		
		min-width: 10rem;
		
		border-radius: 2rem;
		background: white;
	}
</style>
