<script lang="ts">
	import Page from './Page.svelte';

	interface Props {
		width: number;
		height: number;
		max_image_side: number;
		images: { url: string; width: number; height: number }[];
		page_layout: 'spread' | 'single';
	}

	let {
		width,
		height,
		max_image_side,
		images = $bindable([]),
		page_layout: view
	}: Props = $props();

	let pages_images = $state([[], []]);

	$effect(() => {
		images = pages_images.flat();
	});
</script>

<div class="flex flex-col justify-center gap-4">
	<div
		class="grid w-full justify-items-center gap-4"
		class:grid-cols-1={view === 'single'}
		class:grid-cols-2={view === 'spread'}
	>
		{#each pages_images as _, page_index}
			<Page {width} {height} {max_image_side} bind:images={pages_images[page_index]} />
		{/each}
	</div>
	<div class="flex justify-center">
		<button
			class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-400"
			onclick={() => pages_images.push([])}
		>
			Add page
		</button>
	</div>
</div>
