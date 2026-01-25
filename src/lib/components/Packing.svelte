<script lang="ts">
	import { pack } from '$lib/packing/packing';

	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	const { width, height, images }: Props = $props();

	const pack_catch_error = (
		images: { url: string; width: number; height: number }[],
		width: number,
		height: number
	) => {
		try {
			return pack(images, width, height, { border_padding: 0, rectangle_padding: 10 });
		} catch (e) {
			return [];
		}
	};

	const bins = $derived(pack_catch_error(images, width, height));
</script>

<div class="min-h-screen w-full">
	<div class="grid grid-cols-3 gap-4">
		{#each bins as bin}
			<div class="bg-white" style="aspect-ratio: {width} / {height};">
				{#each bin as rect}
					<img
						src={rect.url}
						alt=""
						style="
							width: {(rect.width / width) * 100}%;
							height: {(rect.height / height) * 100}%;
							top: {(rect.y / height) * 100}%;
							left: {(rect.x / width) * 100}%;
						"
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
