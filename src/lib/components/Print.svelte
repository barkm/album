<script lang="ts">
	import { pack, type PackedRectangle } from '$lib/packing/packing';

	interface Props {
		width: number;
		height: number;
		images: { url: string; width: number; height: number }[];
	}

	const { width, height, images }: Props = $props();

	const image_cache = new Map<string, Promise<HTMLImageElement>>();

	const load_image = (url: string) => {
		let cached = image_cache.get(url);
		if (!cached) {
			cached = new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = url;
			});
			image_cache.set(url, cached);
		}
		return cached;
	};

	const download_bin = async (
		bin: PackedRectangle<{ url: string; width: number; height: number; rotated: boolean }>[],
		index: number
	) => {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);

		for (const rect of bin) {
			const img = await load_image(rect.url);
			ctx.save();
			if (rect.rotated) {
				ctx.translate(rect.x, rect.y);
				ctx.rotate((90 * Math.PI) / 180);
				ctx.drawImage(img, 0, -rect.width, rect.height, rect.width);
			} else {
				ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
			}
			ctx.restore();
		}

		const link = document.createElement('a');
		link.href = canvas.toDataURL('image/png');
		link.download = `${index + 1}.png`;
		link.click();
	};

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

	const download_all_bins = async () => {
		for (let i = 0; i < bins.length; i++) {
			await download_bin(bins[i], i);
		}
	};
</script>

<div class="mb-4 flex justify-end">
	<button
		class="rounded bg-gray-700 px-4 py-2 text-sm text-white"
		onclick={download_all_bins}
		type="button"
	>
		Download
	</button>
</div>
<div class="grid grid-cols-3 gap-4">
	{#each bins as bin}
		<div class="relative bg-white" style="aspect-ratio: {width} / {height};">
			{#each bin as rect}
				<img
					src={rect.url}
					alt=""
					class="absolute"
					style="
							width: {(rect.rotated ? rect.height / width : rect.width / width) * 100}%;
							height: {(rect.rotated ? rect.width / height : rect.height / height) * 100}%;
							top: {(rect.y / height) * 100}%;
							left: {(rect.x / width) * 100}%;
							transform: {rect.rotated ? 'rotate(90deg) translate(0, -100%)' : 'none'};
							transform-origin: top left;
						"
				/>
			{/each}
		</div>
	{/each}
</div>
