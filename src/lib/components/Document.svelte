<script lang="ts">
	import type { KonvaEventObject } from 'konva/lib/Node';
	import { onDestroy, onMount } from 'svelte';
	import { Group, Layer, Stage, Image as KonvaImage, Transformer } from 'svelte-konva';

	interface Props {
		width?: number;
		height?: number;
		images?: { url: string; width: number; height: number }[];
	}

	let { width = 2 * 1920, height = 2 * 1080, images = $bindable([]) }: Props = $props();

	const aspect_ratio = $derived(width / height);

	// ----------------- Layout -----------------

	let view_port: HTMLDivElement | null = null;
	let document: HTMLDivElement | null = null;
	let document_width: number = $state(0);
	let document_height: number = $state(0);

	let konva_width = $derived(width);
	let konva_scale = $derived(document_width / konva_width);

	function layout() {
		if (!view_port) return;

		const vw = view_port.clientWidth;
		const vh = view_port.clientHeight;

		const availableRatio = vw / vh;

		if (availableRatio > aspect_ratio) {
			document_height = vh;
			document_width = Math.round(vh * aspect_ratio);
		} else {
			document_width = vw;
			document_height = Math.round(vw / aspect_ratio);
		}
	}

	let ro: ResizeObserver | null = null;

	onMount(async () => {
		layout();
		ro = new ResizeObserver(layout);
		if (view_port) {
			ro.observe(view_port);
		}
		window.addEventListener('keydown', handleKeyDown);
		dropped_images = await Promise.all(
			images.map(async (it) => {
				const { w, h } = fitToMaxWidth(it.width, it.height);
				return {
					id: crypto.randomUUID(),
					url: '', // No URL for preloaded images
					x: 0,
					y: 0,
					img: await loadHtmlImage(it.url),
					w,
					h
				};
			})
		);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	// ----------------- Drag and drop images -----------------

	type DroppedImage = {
		id: string;
		url: string;
		img: HTMLImageElement;
		x: number;
		y: number;
		w: number;
		h: number;
	};

	let dropped_images: DroppedImage[] = $state([]);

	$effect(() => {
		images = dropped_images.map(({ url, w, h }) => ({ url, width: w, height: h }));
	});

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	};

	const onDrop = async (e: DragEvent) => {
		e.preventDefault();
		if (!document) return;

		const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
			f.type.startsWith('image/')
		);
		if (files.length === 0) return;

		// Browser coords -> document pixel coords
		const r = document.getBoundingClientRect();
		const px = e.clientX - r.left;
		const py = e.clientY - r.top;

		// Pixel coords -> world coords
		const dropX = px / konva_scale;
		const dropY = py / konva_scale;

		// Load each image and place centered under cursor
		for (const file of files) {
			const url = URL.createObjectURL(file);

			try {
				const img = await loadHtmlImage(url);
				const { w, h } = fitToMaxWidth(img.naturalWidth, img.naturalHeight);

				// Center under cursor => compute top-left
				const x = dropX - w / 2;
				const y = dropY - h / 2;

				dropped_images = [
					...dropped_images,
					{
						id: crypto.randomUUID(),
						url,
						img,
						x,
						y,
						w,
						h
					}
				];
			} catch (err) {
				URL.revokeObjectURL(url);
				console.error('Failed to load dropped image:', err);
			}
		}
	};

	const fitToMaxWidth = (naturalW: number, naturalH: number) => {
		const w = Math.min(konva_width, naturalW);
		const h = naturalH * (w / naturalW);
		return { w, h };
	};

	async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	// ----------------- Selection & Transformer ------------------

	let transformer: Transformer | null = $state(null);
	let selected_id: string | null = null;

	// 3. Type the Mouse Event
	function handleSelect(e: KonvaEventObject<MouseEvent>, item: DroppedImage) {
		e.cancelBubble = true;
		selected_id = item.id;

		if (transformer) {
			transformer.node.nodes([e.target]);
			transformer.node.getLayer()?.batchDraw();
		}
	}

	function handleDeselect(e: KonvaEventObject<MouseEvent>) {
		// Check if the click target is the Stage itself
		// We cast to Konva.Stage because we know what getStage() returns
		const clickedOnEmpty = e.target === e.target.getStage();

		if (clickedOnEmpty && transformer) {
			selected_id = null;
			transformer.node.nodes([]);
			transformer.node.getLayer()?.batchDraw();
		}
	}

	// 4. Type the Transform Event
	function handleTransformEnd(e: KonvaEventObject<Event>) {
		// Cast target to Konva.Node (or Konva.Image) to access width()/scaleX()
		const node = e.target;

		const scaleX = node.scaleX();
		const scaleY = node.scaleY();

		// Reset scale to 1 so we can drive size by width/height only
		node.scaleX(1);
		node.scaleY(1);

		const index = dropped_images.findIndex((img) => img.id === selected_id);
		if (index !== -1) {
			dropped_images[index] = {
				...dropped_images[index],
				x: node.x(),
				y: node.y(),
				w: Math.max(5, node.width() * scaleX),
				h: Math.max(5, node.height() * scaleY)
			};
			// Trigger reactivity
			dropped_images = [...dropped_images];
		}
	}

	// ----------------- Deletion ------------------

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Backspace' || e.key === 'Delete') {
			if (selected_id) {
				// Prevent the browser from navigating back (default Backspace behavior)
				e.preventDefault();

				// Remove the item from the list
				dropped_images = dropped_images.filter((img) => img.id !== selected_id);

				// Clear the selection state
				selected_id = null;
				if (transformer) {
					transformer.node.nodes([]);
					transformer.node.getLayer()?.batchDraw();
				}
			}
		}
	}
</script>

<div bind:this={view_port} class="flex min-h-screen w-full items-center justify-center">
	<div
		bind:this={document}
		class="overflow-hidden rounded-sm bg-white shadow-lg"
		style={`width:${document_width}px; height:${document_height}px;`}
		ondragover={onDragOver}
		ondrop={onDrop}
		role="region"
	>
		{#if document_width && document_height}
			<Stage width={document_width} height={document_height} onmousedown={handleDeselect}>
				<Layer>
					<Group scaleX={konva_scale} scaleY={konva_scale}>
						{#each dropped_images as it (it.id)}
							<KonvaImage
								image={it.img}
								x={it.x}
								y={it.y}
								width={it.w}
								height={it.h}
								draggable={true}
								onmousedown={(e) => handleSelect(e, it)}
								ontransformend={handleTransformEnd}
							/>
						{/each}

						<Transformer bind:this={transformer} />
					</Group>
				</Layer>
			</Stage>
		{/if}
	</div>
</div>
