<script lang="ts">
	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	const { width = 1920, height = 1080, images = [] }: Props = $props();
</script>

{#each images as image}
	<img src={image.url} alt="Packed Image" />
{/each}
