export interface Rectangle {
	width: number;
	height: number;
}

export type PackedRectangle<R extends Rectangle> = R & { x: number; y: number };

export const pack = <R extends Rectangle>(
	rectangles: R[],
	width: number,
	height: number,
	options?: {
		border_padding?: number;
		rectangle_padding?: number;
	}
): PackedRectangle<R>[][] => {
	if (rectangles.length === 0) {
		return [];
	}
	if (rectangles.some((rect) => rect.width > width || rect.height > height)) {
		throw new Error('One or more rectangles do not fit within the given dimensions.');
	}
	if (rectangles.some((rect) => rect.width <= 0 || rect.height <= 0)) {
		throw new Error('Rectangles must have positive width and height.');
	}
	const border_padding = options?.border_padding ?? 0;
	const rectangle_padding = options?.rectangle_padding ?? 0;
	rectangles = rectangles.map((rect) => ({
		...rect,
		width: rect.width + rectangle_padding,
		height: rect.height + rectangle_padding
	}));
	width = width - border_padding * 2 + rectangle_padding;
	height = height - border_padding * 2 + rectangle_padding;
	const bins = packHelper(rectangles, width, height);
	return bins.map((bin) =>
		bin.map((rect) => ({
			...rect,
			width: rect.width - rectangle_padding,
			height: rect.height - rectangle_padding,
			x: rect.x + border_padding,
			y: rect.y + border_padding
		}))
	);
};

const packHelper = <R extends Rectangle>(
	rectangles: R[],
	width: number,
	height: number
): PackedRectangle<R>[][] => {
	let packed_rectangles: PackedRectangle<R>[][] = [];
	let current_bin: PackedRectangle<R>[] = [{ ...rectangles[0], x: 0, y: 0 }];
	let current_x = rectangles[0].width;
	let current_shelf_floor = 0;
	let current_shelf_height = rectangles[0].height;
	for (let i = 1; i < rectangles.length; i++) {
		const rect = rectangles[i];
		if (current_x + rect.width <= width && current_shelf_floor + rect.height <= height) {
			current_bin.push({ ...rect, x: current_x, y: current_shelf_floor });
			current_x += rect.width;
			current_shelf_height = Math.max(current_shelf_height, rect.height);
		} else if (current_shelf_floor + current_shelf_height + rect.height <= height) {
			current_x = 0;
			current_shelf_floor += current_shelf_height;
			current_shelf_height = rect.height;
			current_bin.push({ ...rect, x: current_x, y: current_shelf_floor });
			current_x += rect.width;
		} else {
			packed_rectangles.push(current_bin);
			current_bin = [{ ...rect, x: 0, y: 0 }];
			current_x = rect.width;
			current_shelf_floor = 0;
			current_shelf_height = rect.height;
		}
	}
	packed_rectangles.push(current_bin);
	return packed_rectangles;
};
