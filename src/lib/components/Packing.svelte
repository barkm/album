<script lang="ts">
	import { pack } from '$lib/packing/packing';

	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	const { width = 1920, height = 1080, images = [] }: Props = $props();

	const pack_catch_error = (
		images: { url: string; width: number; height: number }[],
		width: number,
		height: number
	) => {
		try {
			return pack(images, width, height, { border_padding: 50 });
		} catch (e) {
			return [];
		}
	};

	const bins = $derived(pack_catch_error(images, width, height));

	$inspect(bins);
</script>

{#each bins as bin}
	<div class="mb-8">
		<div class="relative bg-white" style="width: 50%; aspect-ratio: {width} / {height};">
			{#each bin as rect}
				<img
					src={rect.url}
					alt=""
					class="absolute border"
					style="
                        width: {(rect.width / width) * 100}%;
                        height: {(rect.height / height) * 100}%;
                        left: {(rect.x / width) * 100}%;
                        top: {(rect.y / height) * 100}%;
                    "
				/>
			{/each}
		</div>
	</div>
{/each}
