export interface Rectangle {
	width: number;
	height: number;
}

export const pack = (rectangles: Rectangle[], width: number, height: number): Rectangle[][] => {
	if (rectangles.length === 0) {
		return [];
	}
	return [rectangles];
};
