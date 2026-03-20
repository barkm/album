<script lang="ts">
	import { copyImageToClipboard } from '$lib/clipboard';
	import { loadHtmlImage } from '$lib/image';
	import type { KonvaEventObject } from 'konva/lib/Node';
	import { onDestroy, onMount } from 'svelte';
	import {
		Group,
		Layer,
		Stage,
		Image as KonvaImage,
		Transformer,
		Rect,
		type KonvaDragTransformEvent
	} from 'svelte-konva';

	interface Props {
		width: number;
		height: number;
		max_image_side: {
			long: number;
			short: number;
		};
		images: {
			id: string;
			blob: Blob;
			url: string;
			image: HTMLImageElement;
			width: number;
			height: number;
			x: number;
			y: number;
			naturalWidth: number;
			naturalHeight: number;
			cropX?: number;
			cropY?: number;
			cropWidth?: number;
			cropHeight?: number;
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
	let min_side = $derived(0.05 * Math.min(width, height));

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
		history = [[...dropped_images]];
		history_index = 0;
		layout();
		ro = new ResizeObserver(layout);
		if (view_port) {
			ro.observe(view_port);
		}
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('paste', handlePaste);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('paste', handlePaste);
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
		cropX?: number;
		cropY?: number;
		cropWidth?: number;
		cropHeight?: number;
	};

	const fit_to_max_side = (naturalW: number, naturalH: number) => {
		const long_side = Math.max(naturalW, naturalH);
		const short_side = Math.min(naturalW, naturalH);
		if (long_side <= max_image_side.long && short_side <= max_image_side.short) {
			return { w: naturalW, h: naturalH };
		}
		const scale = Math.min(max_image_side.long / long_side, max_image_side.short / short_side);
		return { w: naturalW * scale, h: naturalH * scale };
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
				h,
				cropX: it.cropX,
				cropY: it.cropY,
				cropWidth: it.cropWidth,
				cropHeight: it.cropHeight
			};
		})
	);

	let history: DroppedImage[][] = [];
	let history_index = 0;

	function pushHistory() {
		history = history.slice(0, history_index + 1);
		history.push([...dropped_images]);
		history_index++;
	}

	$effect(() => {
		images = dropped_images.map(
			({ id, blob, url, img, w, h, x, y, cropX, cropY, cropWidth, cropHeight }) => ({
				id,
				blob,
				url,
				image: img,
				width: w,
				height: h,
				x,
				y,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight,
				cropX,
				cropY,
				cropWidth,
				cropHeight
			})
		);
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

		// Browser coords -> world coords
		const r = document.getBoundingClientRect();
		const dropX = (e.clientX - r.left) / konva_scale;
		const dropY = (e.clientY - r.top) / konva_scale;

		await addImageFiles(Array.from(e.dataTransfer?.files ?? []), dropX, dropY);
	};

	let mouse_world: { x: number; y: number } | null = null;

	const onMouseMove = (e: MouseEvent) => {
		if (!document) return;
		const r = document.getBoundingClientRect();
		mouse_world = {
			x: (e.clientX - r.left) / konva_scale,
			y: (e.clientY - r.top) / konva_scale
		};
	};

	const onMouseLeave = () => {
		mouse_world = null;
	};

	async function handlePaste(e: ClipboardEvent) {
		if (!mouse_world) return;

		const files = Array.from(e.clipboardData?.items ?? [])
			.filter((item) => item.kind === 'file')
			.map((item) => item.getAsFile())
			.filter((f): f is File => f !== null);

		await addImageFiles(files, mouse_world.x, mouse_world.y);
	}

	async function addImageFiles(all_files: File[], centerX: number, centerY: number) {
		const files = getSupportedImageFiles(all_files);
		for (const file of files) {
			const url = URL.createObjectURL(file);

			let img: HTMLImageElement;
			try {
				img = await loadHtmlImage(url);
			} catch {
				URL.revokeObjectURL(url);
				alert(`Failed to load image file: ${file.name} (${file.type})`);
				return;
			}

			const { w, h } = fit_to_max_side(img.naturalWidth, img.naturalHeight);
			dropped_images = [
				...dropped_images,
				{
					id: crypto.randomUUID(),
					blob: file,
					url,
					img,
					...clampPosition(centerX - w / 2, centerY - h / 2, w, h),
					w,
					h
				}
			];
			pushHistory();
		}
	}

	// ----------------- Crop ------------------

	type CropState = {
		imageId: string;
		cx: number;
		cy: number;
		cw: number;
		ch: number;
		fullX: number;
		fullY: number;
		fullW: number;
		fullH: number;
	};
	let crop_state: CropState | null = $state(null);
	let crop_rect_node: Rect | null = $state(null);
	let crop_transformer: Transformer | null = $state(null);

	$effect(() => {
		if (crop_transformer && crop_rect_node) {
			crop_transformer.node.nodes([crop_rect_node.node]);
			crop_transformer.node.getLayer()?.batchDraw();
		}
	});

	function enterCropMode() {
		if (!selected_id) return;
		const img = dropped_images.find((i) => i.id === selected_id);
		if (!img) return;
		clearSelection();
		const srcX = img.cropX ?? 0;
		const srcY = img.cropY ?? 0;
		const srcW = img.cropWidth ?? img.img.naturalWidth;
		const srcH = img.cropHeight ?? img.img.naturalHeight;
		const scaleX = img.w / srcW;
		const scaleY = img.h / srcH;
		crop_state = {
			imageId: img.id,
			cx: img.x,
			cy: img.y,
			cw: img.w,
			ch: img.h,
			fullX: img.x - srcX * scaleX,
			fullY: img.y - srcY * scaleY,
			fullW: img.img.naturalWidth * scaleX,
			fullH: img.img.naturalHeight * scaleY
		};
	}

	function confirmCrop() {
		if (!crop_state) return;
		const index = dropped_images.findIndex((i) => i.id === crop_state!.imageId);
		if (index === -1) {
			crop_state = null;
			return;
		}
		const img = dropped_images[index];

		// Convert crop rect from world coords to natural pixels using full image extent as reference
		const scaleToNatural = img.img.naturalWidth / crop_state.fullW;
		const newCropX = (crop_state.cx - crop_state.fullX) * scaleToNatural;
		const newCropY =
			(crop_state.cy - crop_state.fullY) * (img.img.naturalHeight / crop_state.fullH);
		const newCropW = crop_state.cw * scaleToNatural;
		const newCropH = crop_state.ch * (img.img.naturalHeight / crop_state.fullH);

		const { x: newX, y: newY } = clampPosition(
			crop_state.cx,
			crop_state.cy,
			crop_state.cw,
			crop_state.ch
		);

		dropped_images[index] = {
			...img,
			x: newX,
			y: newY,
			w: crop_state.cw,
			h: crop_state.ch,
			cropX: newCropX,
			cropY: newCropY,
			cropWidth: newCropW,
			cropHeight: newCropH
		};
		dropped_images = [...dropped_images];
		crop_state = null;
		pushHistory();
	}

	function cancelCrop() {
		crop_state = null;
	}

	// ----------------- Selection & Transformer ------------------

	let transformer: Transformer | null = $state(null);
	let selected_id: string | null = $state(null);

	// ----------------- Undo / Redo ------------------

	function clearSelection() {
		selected_id = null;
		if (transformer) {
			transformer.node.nodes([]);
			transformer.node.getLayer()?.batchDraw();
		}
	}

	function undo() {
		if (history_index <= 0) return;
		history_index--;
		dropped_images = [...history[history_index]];
		clearSelection();
	}

	function redo() {
		if (history_index >= history.length - 1) return;
		history_index++;
		dropped_images = [...history[history_index]];
		clearSelection();
	}

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

	function clampPosition(x: number, y: number, w: number, h: number) {
		return {
			x: Math.max(0, Math.min(x, width - w)),
			y: Math.max(0, Math.min(y, height - h))
		};
	}

	function makeDragBoundFunc(item: DroppedImage) {
		return (pos: { x: number; y: number }) => ({
			x: Math.max(0, Math.min(pos.x, (width - item.w) * konva_scale)),
			y: Math.max(0, Math.min(pos.y, (height - item.h) * konva_scale))
		});
	}

	const constrainSize = (newW: number, newH: number) => {
		const { w, h } = fit_to_max_side(newW, newH);
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
			const { x, y } = clampPosition(node.x(), node.y(), constrained_size.w, constrained_size.h);
			node.x(x);
			node.y(y);
			dropped_images[index] = {
				...dropped_images[index],
				x,
				y,
				w: constrained_size.w,
				h: constrained_size.h
			};
			dropped_images = [...dropped_images];
			pushHistory();
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
			dropped_images = [...dropped_images];
			pushHistory();
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
				e.preventDefault();
				dropped_images = dropped_images.filter((img) => img.id !== selected_id);
				clearSelection();
				pushHistory();
			}
		}

		if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x') && selected_id) {
			const img = dropped_images.find((img) => img.id === selected_id);
			if (img) {
				copyImageToClipboard(img.blob);
				if (e.key === 'x') {
					dropped_images = dropped_images.filter((i) => i.id !== selected_id);
					clearSelection();
					pushHistory();
				}
			}
		}

		if (e.key === 'c' && !e.metaKey && !e.ctrlKey && mouse_world && selected_id) {
			enterCropMode();
		}

		if (crop_state) {
			if (e.key === 'Enter') {
				e.preventDefault();
				confirmCrop();
			}
			if (e.key === 'Escape') {
				cancelCrop();
			}
		}

		if ((e.ctrlKey || e.metaKey) && e.key === 'z' && mouse_world) {
			e.preventDefault();
			if (e.shiftKey) redo();
			else undo();
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
		class="relative overflow-hidden rounded-sm bg-white shadow-lg"
		style={`width:${document_width}px; height:${document_height}px;`}
		ondragover={onDragOver}
		ondrop={onDrop}
		onmousemove={onMouseMove}
		onmouseleave={onMouseLeave}
		role="region"
	>
		{#if document_width && document_height}
			<Stage width={document_width} height={document_height} onmousedown={handleDeselect}>
				<Layer>
					<Group scaleX={konva_scale} scaleY={konva_scale}>
						{#each dropped_images as it (it.id)}
							{@const _cs = crop_state}
							{@const is_crop_target = _cs !== null && _cs.imageId === it.id}
							<KonvaImage
								image={it.img}
								x={is_crop_target ? _cs!.fullX : it.x}
								y={is_crop_target ? _cs!.fullY : it.y}
								width={is_crop_target ? _cs!.fullW : it.w}
								height={is_crop_target ? _cs!.fullH : it.h}
								draggable={crop_state === null}
								dragBoundFunc={makeDragBoundFunc(it)}
								onmousedown={(e) => handleSelect(e, it)}
								ondragend={(e) => handleDragEnd(e, it)}
								ontransformend={handleTransformEnd}
								ontransform={handleTransform}
								cropX={is_crop_target ? undefined : it.cropX}
								cropY={is_crop_target ? undefined : it.cropY}
								cropWidth={is_crop_target ? undefined : it.cropWidth}
								cropHeight={is_crop_target ? undefined : it.cropHeight}
							/>
						{/each}

						{#if crop_state}
							<Rect
								x={crop_state.cx}
								y={crop_state.cy}
								width={crop_state.cw}
								height={crop_state.ch}
								stroke="rgba(100,220,100,0.85)"
								fill="rgba(100,220,100,0.15)"
								strokeWidth={2 / konva_scale}
								draggable={true}
								dragBoundFunc={(pos) => {
									if (!crop_state) return pos;
									const imgLeft = crop_state.fullX * konva_scale;
									const imgTop = crop_state.fullY * konva_scale;
									const imgRight = (crop_state.fullX + crop_state.fullW) * konva_scale;
									const imgBottom = (crop_state.fullY + crop_state.fullH) * konva_scale;
									const cwStage = crop_state.cw * konva_scale;
									const chStage = crop_state.ch * konva_scale;
									return {
										x: Math.max(imgLeft, Math.min(pos.x, imgRight - cwStage)),
										y: Math.max(imgTop, Math.min(pos.y, imgBottom - chStage))
									};
								}}
								ondragend={() => {
									if (!crop_state || !crop_rect_node) return;
									const node = crop_rect_node.node;
									crop_state = { ...crop_state, cx: node.x(), cy: node.y() };
								}}
								ontransformend={() => {
									if (!crop_state || !crop_rect_node) return;
									const node = crop_rect_node.node;
									const newW = node.width() * node.scaleX();
									const newH = node.height() * node.scaleY();
									node.scaleX(1);
									node.scaleY(1);
									node.width(newW);
									node.height(newH);
									crop_state = { ...crop_state, cx: node.x(), cy: node.y(), cw: newW, ch: newH };
								}}
								bind:this={crop_rect_node}
							/>
							<Transformer
								bind:this={crop_transformer}
								rotateEnabled={false}
								flipEnabled={false}
								boundBoxFunc={(oldBox, newBox) => {
									if (!crop_state) return oldBox;
									const imgLeft = crop_state.fullX * konva_scale;
									const imgTop = crop_state.fullY * konva_scale;
									const imgRight = (crop_state.fullX + crop_state.fullW) * konva_scale;
									const imgBottom = (crop_state.fullY + crop_state.fullH) * konva_scale;
									const minSize = min_side * konva_scale;
									const x = Math.max(imgLeft, Math.min(newBox.x, imgRight - minSize));
									const y = Math.max(imgTop, Math.min(newBox.y, imgBottom - minSize));
									const width = Math.min(newBox.width, imgRight - x);
									const height = Math.min(newBox.height, imgBottom - y);
									if (width < minSize || height < minSize) return oldBox;
									return { ...newBox, x, y, width, height };
								}}
							/>
						{/if}

						<Transformer
							bind:this={transformer}
							flipEnabled={false}
							visible={crop_state === null}
						/>
					</Group>
				</Layer>
			</Stage>
		{/if}
		{#if selected_id && !crop_state}
			{@const sel = dropped_images.find((i) => i.id === selected_id)}
			{#if sel}
				<div
					class="absolute flex gap-1"
					style={`left: ${Math.round((sel.x + sel.w) * konva_scale)}px; top: ${Math.round(sel.y * konva_scale)}px; transform: translate(calc(-100% - 6px), 6px);`}
				>
					<button
						class="rounded bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
						onclick={enterCropMode}
						title="Crop (C)"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M6 2v14a2 2 0 0 0 2 2h14" />
							<path d="M18 22V8a2 2 0 0 0-2-2H2" />
						</svg>
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
