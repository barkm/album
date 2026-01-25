<script lang="ts">
	import Page from './Page.svelte';

	interface Props {
		width: number;
		height: number;
		images?: { url: string; width: number; height: number }[];
	}

	let { width, height, images = $bindable([]) }: Props = $props();
</script>

<Page {width} {height} bind:images />
