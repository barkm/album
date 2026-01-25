export interface Rectangle {
	width: number;
	height: number;
}

export interface PackedRectangle extends Rectangle {
	x: number;
	y: number;
}

export const pack = (
	rectangles: Rectangle[],
	width: number,
	height: number
): PackedRectangle[][] => {
	if (rectangles.length === 0) {
		return [];
	}
	if (rectangles.some((rect) => rect.width > width || rect.height > height)) {
		throw new Error('One or more rectangles do not fit within the given dimensions.');
	}
	if (rectangles.some((rect) => rect.width <= 0 || rect.height <= 0)) {
		throw new Error('Rectangles must have positive width and height.');
	}
	let packed_rectangles: PackedRectangle[] = [];
	let current_x = 0;
	for (let i = 0; i < rectangles.length; i++) {
		const rect = rectangles[i];
		packed_rectangles.push({
			...rect,
			x: current_x,
			y: 0
		});
		current_x += rect.width;
	}
	return [packed_rectangles];
};
