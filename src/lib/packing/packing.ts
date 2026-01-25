export interface Rectangle {
	width: number;
	height: number;
}

export const pack = (rectangles: Rectangle[], width: number, height: number): Rectangle[][] => {
	if (rectangles.length === 0) {
		return [];
	}
	if (rectangles.some((rect) => rect.width > width || rect.height > height)) {
		throw new Error('One or more rectangles do not fit within the given dimensions.');
	}
	return [rectangles];
};
