<script lang="ts">
	import Page from './Page.svelte';

	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	let { width, height, images = $bindable([]) }: Props = $props();

	let pages_images = $state([[]]);

	$effect(() => {
		images = pages_images.flat();
	});
</script>

<div class="flex min-h-screen w-full flex-col justify-center gap-4">
	{#each pages_images as _, page_index}
		<Page {width} {height} bind:images={pages_images[page_index]} />
	{/each}
	<div class="flex justify-center">
		<button
			class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-400"
			onclick={() => pages_images.push([])}
		>
			Add page
		</button>
	</div>
</div>
