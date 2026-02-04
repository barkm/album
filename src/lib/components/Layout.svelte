<script lang="ts">
	import Page from './Page.svelte';
	import { db } from '$lib/db';
	import { onMount } from 'svelte';

	interface Props {
		width: number;
		height: number;
		max_image_side: {
			long: number;
			short: number;
		};
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

	let pages_images:
		| {
				id: string;
				blob: Blob;
				url: string;
				image: HTMLImageElement;
				width: number;
				height: number;
				x: number;
				y: number;
		  }[][]
		| null = $state(null);

	$effect(() => {
		if (!pages_images) return;
		images = pages_images.flat().map(({ blob, url, image, width, height, x, y }) => ({
			blob,
			url,
			image,
			width,
			height,
			x,
			y
		}));
	});

	$effect(() => {
		if (!pages_images) return;
		const pages_snapshot = pages_images.map((page) => [...page]);
		update_db(pages_snapshot);
	});

	const update_db = async (_pages_images: typeof pages_images) => {
		if (!_pages_images) return;
		await update_or_add_images(_pages_images);
		await remove_stale_images(_pages_images);
	};

	const update_or_add_images = async (_pages_images: typeof pages_images) => {
		if (!_pages_images) return;
		const db_images = await db.images.toArray();
		const db_ids = db_images.map((img) => img.id);
		for (const [page, page_images] of _pages_images.entries()) {
			for (const img of page_images) {
				if (!db_ids.includes(img.id)) {
					await db.images.add({
						id: img.id,
						page: page,
						data: img.blob,
						width: img.width,
						height: img.height,
						x: img.x,
						y: img.y
					});
				} else {
					await db.images.update(img.id, {
						page: page,
						x: img.x,
						y: img.y
					});
				}
			}
		}
	};

	const remove_stale_images = async (_pages_images: typeof pages_images) => {
		if (!_pages_images) return;
		const db_images = await db.images.toArray();
		const current_ids = _pages_images.flat().map((img) => img.id);
		for (const img of db_images) {
			if (!current_ids.includes(img.id)) {
				await db.images.delete(img.id);
			}
		}
	};

	const load_images_from_db = async () => {
		const imgs = await db.images.toArray();
		const max_page = Math.max(
			imgs.reduce((max, img) => Math.max(max, img.page), -1),
			view === 'single' ? 0 : 1
		);
		const loaded_pages: typeof pages_images = Array.from({ length: max_page + 1 }, () => []);

		for (const img of imgs) {
			const url = URL.createObjectURL(img.data);
			loaded_pages[img.page] = [
				...loaded_pages[img.page],
				{
					id: img.id,
					blob: img.data,
					url,
					image: await loadHtmlImage(url),
					width: img.width,
					height: img.height,
					x: img.x,
					y: img.y
				}
			];
		}

		pages_images = loaded_pages;
	};

	onMount(load_images_from_db);

	async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}
</script>

{#if pages_images !== null}
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
				onclick={() => {
					if (!pages_images) return;
					pages_images.push([]);
				}}
			>
				Add page
			</button>
		</div>
	</div>
{/if}
