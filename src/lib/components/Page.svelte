<script lang="ts">
	import type { KonvaEventObject } from 'konva/lib/Node';
	import { onDestroy, onMount } from 'svelte';
	import {
		Group,
		Layer,
		Stage,
		Image as KonvaImage,
		Transformer,
		type KonvaDragTransformEvent
	} from 'svelte-konva';

	interface Props {
		width: number;
		height: number;
		max_image_side: number;
		images: {
			id: string;
			blob: Blob;
			url: string;
			image: HTMLImageElement;
			width: number;
			height: number;
			x: number;
			y: number;
		}[];
	}

	let { width, height, max_image_side, images = $bindable([]) }: Props = $props();
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
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	// ----------------- Drag and drop images -----------------

	type DroppedImage = {
		id: string;
		blob: Blob;
		url: string;
		img: HTMLImageElement;
		x: number;
		y: number;
		w: number;
		h: number;
	};

	const fit_to_max_side = (naturalW: number, naturalH: number) => {
		if (naturalW <= max_image_side && naturalH <= max_image_side) {
			return { w: naturalW, h: naturalH };
		}
		if (naturalW >= naturalH) {
			const w = max_image_side;
			const h = naturalH * (w / naturalW);
			return { w, h };
		} else {
			const h = max_image_side;
			const w = naturalW * (h / naturalH);
			return { w, h };
		}
	};

	let dropped_images: DroppedImage[] = $state(
		images.map((it) => {
			const { w, h } = fit_to_max_side(it.width, it.height);
			return {
				id: it.id,
				url: it.url,
				x: it.x,
				y: it.y,
				img: it.image,
				blob: it.blob,
				w,
				h
			};
		})
	);

	$effect(() => {
		images = dropped_images.map(({ id, blob, url, img, w, h, x, y }) => ({
			id,
			blob,
			url,
			image: img,
			width: w,
			height: h,
			x,
			y
		}));
	});

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	};

	const getSupportedImageFiles = (all_files: File[]): File[] => {
		const non_image_files = all_files.filter((f) => !isImageFile(f));
		if (non_image_files.length > 0) {
			const details = non_image_files.map((f) => `${f.name} (${f.type})`).join(', ');
			alert(`The following files are not images and will be ignored: ${details}`);
		}

		const heic_files = all_files.filter(isHeicFile);
		if (!isSafari() && heic_files.length > 0) {
			const details = heic_files.map((f) => `${f.name} (${f.type.split('/')[1]})`).join(', ');
			alert(`HEIC/HEIF images are only supported in Safari. Files: ${details}`);
			return all_files.filter((f) => !isHeicFile(f));
		}
		return all_files.filter(isImageFile);
	};

	const isImageFile = (file: File): boolean => {
		return file.type.startsWith('image/');
	};

	const isSafari = (): boolean => {
		return (
			typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
		);
	};

	const isHeicFile = (file: File): boolean => {
		return file.type === 'image/heic' || file.type === 'image/heif';
	};

	const onDrop = async (e: DragEvent) => {
		e.preventDefault();
		if (!document) return;

		const all_files = Array.from(e.dataTransfer?.files ?? []);
		const files = getSupportedImageFiles(all_files);

		if (files.length === 0) {
			return;
		}

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

			let img: HTMLImageElement;
			try {
				img = await loadHtmlImage(url);
			} catch (err) {
				URL.revokeObjectURL(url);
				alert(`Failed to load image file: ${file.name} of type (${file.type})`);
				return;
			}
			const { w, h } = fit_to_max_side(img.naturalWidth, img.naturalHeight);

			// Center under cursor => compute top-left
			const x = dropX - w / 2;
			const y = dropY - h / 2;

			dropped_images = [
				...dropped_images,
				{
					id: crypto.randomUUID(),
					blob: file,
					url,
					img,
					x,
					y,
					w,
					h
				}
			];
		}
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

	const constrainSize = (newW: number, newH: number) => {
		const { w, h } = fit_to_max_side(newW, newH);
		const min_side = 0.05 * Math.min(width, height);
		if (w < min_side || h < min_side) {
			const scale = min_side / Math.min(w, h);
			return { w: w * scale, h: h * scale };
		}
		return { w, h };
	};

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
			const scale = Math.min(scaleX, scaleY);
			const new_width = node.width() * scale;
			const new_height = node.height() * scale;
			const constrained_size = constrainSize(new_width, new_height);
			dropped_images[index] = {
				...dropped_images[index],
				x: node.x(),
				y: node.y(),
				w: constrained_size.w,
				h: constrained_size.h
			};
			// Trigger reactivity
			dropped_images = [...dropped_images];
		}
	}

	function handleDragEnd(e: KonvaDragTransformEvent, item: DroppedImage) {
		const node = e.target;
		const index = dropped_images.findIndex((img) => img.id === item.id);
		if (index !== -1) {
			dropped_images[index] = {
				...dropped_images[index],
				x: node.x(),
				y: node.y()
			};
			// Trigger reactivity
			dropped_images = [...dropped_images];
		}
	}

	const handleTransform = (e: KonvaEventObject<Event>) => {
		const node = e.target;
		let scale = Math.max(Math.min(node.scaleX(), node.scaleY()), 0.01);
		let new_width = node.width() * scale;
		let new_height = node.height() * scale;
		const constrained_size = constrainSize(new_width, new_height);
		node.width(constrained_size.w);
		node.height(constrained_size.h);
		node.scaleX(1);
		node.scaleY(1);
	};

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

<div
	bind:this={view_port}
	class="flex h-full w-full justify-center"
	style={`aspect-ratio: ${width} / ${height};`}
>
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
								ondragend={(e) => handleDragEnd(e, it)}
								ontransformend={handleTransformEnd}
								ontransform={handleTransform}
							/>
						{/each}

						<Transformer bind:this={transformer} flipEnabled={false} />
					</Group>
				</Layer>
			</Stage>
		{/if}
	</div>
</div>
