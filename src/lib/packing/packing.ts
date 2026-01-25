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
	return [rectangles.map((rect) => ({ ...rect, x: 0, y: 0 }))];
};
