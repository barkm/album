export interface Rectangle {
	width: number;
	height: number;
}

const area = (rect: Rectangle): number => {
	return rect.width * rect.height;
};

const isIn = (a: Rectangle, b: Rectangle): boolean => {
	return a.width <= b.width && a.height <= b.height;
};

const rotate = <R extends Rectangle>(rect: R): R => {
	return { ...rect, width: rect.height, height: rect.width };
};

type RectangleWithRotation<R extends Rectangle> = R & { rotated: boolean };

export type PackedRectangle<R extends Rectangle> = R &
	RectangleWithRotation<R> & { x: number; y: number };

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
	const bounding_rect: Rectangle = { width, height };
	if (
		rectangles.some((rect) => !(isIn(rect, bounding_rect) || isIn(rotate(rect), bounding_rect)))
	) {
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
	const bins = binPack(rectangles, () => new GuillotineBin<R>(width, height));
	return bins.map((bin) =>
		bin.getRectangles().map((rect) => ({
			...rect,
			width: rect.width - rectangle_padding,
			height: rect.height - rectangle_padding,
			x: rect.x + border_padding,
			y: rect.y + border_padding
		}))
	);
};

interface Bin<R extends Rectangle> {
	score: (rect: R) => number | null;
	add: (rect: RectangleWithRotation<R>) => void;
	getRectangles: () => PackedRectangle<R>[];
}

const binPack = <R extends Rectangle>(rectangles: R[], bin_factory: () => Bin<R>): Bin<R>[] => {
	let bins: Bin<R>[] = [];

	while (rectangles.length > 0) {
		let best_rectangle_bin: {
			score: number;
			rect_index: number;
			bin_index: number;
			rotated: boolean;
		} | null = null;
		for (const [rect_index, rect] of rectangles.entries()) {
			for (const rotated of [false, true]) {
				for (const [bin_index, bin] of bins.entries()) {
					const score = bin.score(rotated ? rotate(rect) : rect);
					if (score === null) {
						continue;
					}
					if (!best_rectangle_bin || score < best_rectangle_bin.score) {
						best_rectangle_bin = { score, rect_index, bin_index, rotated };
					}
				}
			}
		}

		if (best_rectangle_bin) {
			const { rect_index, bin_index, rotated } = best_rectangle_bin;
			const bin = bins[bin_index];
			const rectangle = popIndex(rectangles, rect_index);
			const rectangle_to_add = rotated ? rotate(rectangle) : rectangle;
			bin.add({ ...rectangle_to_add, rotated });
		} else {
			const new_bin = bin_factory();
			const rectangle = popIndex(rectangles, 0);
			const rotated_rectangle = rotate(rectangle);
			if (new_bin.score(rectangle) === null && new_bin.score(rotated_rectangle) !== null) {
				new_bin.add({ ...rotated_rectangle, rotated: true });
			} else {
				new_bin.add({ ...rectangle, rotated: false });
			}
			bins.push(new_bin);
		}
	}

	return bins;
};

const popIndex = <T>(array: T[], index: number): T => {
	const item = array[index];
	array.splice(index, 1);
	return item;
};

type FreeRectangle<R extends Rectangle> = R & { x: number; y: number };

class GuillotineBin<R extends Rectangle> implements Bin<R> {
	private rectangles: PackedRectangle<R>[] = [];
	private free_rectangles: FreeRectangle<Rectangle>[] = [];

	constructor(width: number, height: number) {
		this.free_rectangles.push({ x: 0, y: 0, width: width, height: height });
	}

	score(rect: R): number | null {
		return this.best_free_rectangle(rect) ? area(this.best_free_rectangle(rect)!) : null;
	}

	private best_free_rectangle(rect: R): FreeRectangle<Rectangle> | null {
		let best_free_rect: FreeRectangle<Rectangle> | null = null;
		let best_area_fit: number | null = null;
		for (const free_rect of this.free_rectangles) {
			if (isIn(rect, free_rect)) {
				const area_fit = area(free_rect) - area(rect);
				if (best_area_fit === null || area_fit < best_area_fit) {
					best_area_fit = area_fit;
					best_free_rect = free_rect;
				}
			}
		}
		return best_free_rect;
	}

	add(rect: RectangleWithRotation<R>): void {
		const free_rect = this.best_free_rectangle(rect);
		if (!free_rect) {
			return;
		}
		this.rectangles.push({ ...rect, x: free_rect.x, y: free_rect.y });
		this.splitFreeRectangle(free_rect, rect);
	}

	getRectangles(): PackedRectangle<R>[] {
		return this.rectangles;
	}

	private splitFreeRectangle(free_rect: FreeRectangle<Rectangle>, used_rect: R) {
		if (!isIn(used_rect, free_rect)) {
			throw new Error('Used rectangle does not fit within free rectangle.');
		}
		const free_rect_index = this.free_rectangles.indexOf(free_rect);
		popIndex(this.free_rectangles, free_rect_index);

		const right_width = free_rect.width - used_rect.width;
		const bottom_height = free_rect.height - used_rect.height;

		const x_split_rectangles = {
			top: {
				x: free_rect.x + used_rect.width,
				y: free_rect.y,
				width: right_width,
				height: used_rect.height
			},
			bottom: {
				x: free_rect.x,
				y: free_rect.y + used_rect.height,
				width: free_rect.width,
				height: bottom_height
			}
		};

		const y_split_rectangles = {
			right: {
				x: free_rect.x,
				y: free_rect.y + used_rect.height,
				width: used_rect.width,
				height: bottom_height
			},
			left: {
				x: free_rect.x + used_rect.width,
				y: free_rect.y,
				width: right_width,
				height: free_rect.height
			}
		};

		const largest_x_split_rectangle =
			area(x_split_rectangles.top) > area(x_split_rectangles.bottom)
				? x_split_rectangles.top
				: x_split_rectangles.bottom;
		const largest_y_split_rectangle =
			area(y_split_rectangles.right) > area(y_split_rectangles.left)
				? y_split_rectangles.right
				: y_split_rectangles.left;

		if (area(largest_x_split_rectangle) > area(largest_y_split_rectangle)) {
			this.free_rectangles.push(x_split_rectangles.top);
			this.free_rectangles.push(x_split_rectangles.bottom);
		} else {
			this.free_rectangles.push(y_split_rectangles.right);
			this.free_rectangles.push(y_split_rectangles.left);
		}
	}
}
