<script lang="ts">
	import { onMount } from 'svelte';
	import { Group, Layer, Stage, Image as KonvaImage, Transformer } from 'svelte-konva';

	interface Props {
		aspect_ratio?: number;
	}

	const { aspect_ratio = 16 / 9 }: Props = $props();

	// ----------------- Layout -----------------

	let view_port: HTMLDivElement | null = null;
	let document: HTMLDivElement | null = null;
	let document_width: number = $state(0);
	let document_height: number = $state(0);

	let konva_width = $derived(3000 * aspect_ratio);
	let konva_height = $derived(3000);
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

	onMount(() => {
		layout();
		ro = new ResizeObserver(layout);
		if (view_port) {
			ro.observe(view_port);
		}
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

	let images: DroppedImage[] = $state([]);

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

				images = [
					...images,
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
</script>

<div class="h-screen w-screen bg-gray-600 p-10">
	<div bind:this={view_port} class="flex h-full w-full items-center justify-center">
		<div
			bind:this={document}
			class="overflow-hidden rounded-sm bg-white shadow-lg"
			style={`width:${document_width}px; height:${document_height}px;`}
			ondragover={onDragOver}
			ondrop={onDrop}
			role="region"
		>
			{#if document_width && document_height}
				<Stage width={document_width} height={document_height}>
					<Layer>
						<Group scaleX={konva_scale} scaleY={konva_scale}>
							{#each images as it (it.id)}
								<KonvaImage
									image={it.img}
									x={it.x}
									y={it.y}
									width={it.w}
									height={it.h}
									draggable={true}
								/>
							{/each}
						</Group>
					</Layer>
				</Stage>
			{/if}
		</div>
	</div>
</div>
