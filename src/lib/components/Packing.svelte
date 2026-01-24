<script lang="ts">
	import { MaxRectsPacker } from 'maxrects-packer';

	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	const { width = 1920, height = 1080, images = [] }: Props = $props();

	const pack = (
		imgs: { width: number; height: number; url: string }[],
		width: number,
		height: number
	): { x: number; y: number; width: number; height: number; url: string }[][] => {
		const images_copy = imgs.map((it) => ({
			width: it.width,
			height: it.height,
			url: it.url
		}));
		const options = {
			smart: true,
			pot: false,
			square: false,
			allowRotation: false,
			tag: false,
			exclusiveTag: false,
			border: 0,
			logic: 0
		};
		const packer = new MaxRectsPacker(width, height, 0, options);
		// @ts-ignore
		packer.addArray(images_copy);
		for (const bin of packer.bins) {
			console.log('Bin:', bin.width, 'x', bin.height);
			for (const rect of bin.rects) {
				console.log('  Rect:', rect.width, 'x', rect.height, 'at', rect.x, rect.y);
			}
		}
		return packer.bins.map((bin) =>
			bin.rects.map((rect) => ({
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height,
				// @ts-ignore
				url: rect.url
			}))
		);
	};

	const bins = $derived(pack(images, width, height));

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
