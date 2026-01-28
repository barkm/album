import { describe, it, expect } from 'vitest';
import { pack } from './packing';

describe('packing test', () => {
	it('no rectangles', () => {
		expect(pack([], 10, 10)).toEqual([]);
	});

	it('single rectangle fits', () => {
		const rectangles = [{ width: 5, height: 5 }];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(1);
	});

	it('single rectangle does not fit', () => {
		const rectangles = [{ width: 15, height: 5 }];
		expect(() => pack(rectangles, 10, 10)).toThrow();
	});

	it('multiple rectangles fit', () => {
		const rectangles = [
			{ width: 5, height: 5 },
			{ width: 3, height: 3 },
			{ width: 2, height: 2 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(3);
	});

	it('one rectangle does not fit among multiple', () => {
		const rectangles = [
			{ width: 5, height: 5 },
			{ width: 12, height: 3 },
			{ width: 2, height: 2 }
		];
		expect(() => pack(rectangles, 10, 10)).toThrow();
	});

	it('rectangle with zero width or height', () => {
		const rectangles = [
			{ width: 0, height: 5 },
			{ width: 3, height: 0 }
		];
		expect(() => pack(rectangles, 10, 10)).toThrow();
	});

	it('rectangle with negative width or height', () => {
		const rectangles = [
			{ width: -5, height: 5 },
			{ width: 3, height: -3 }
		];
		expect(() => pack(rectangles, 10, 10)).toThrow();
	});

	it('rectangle exactly fits the dimensions', () => {
		const rectangles = [{ width: 10, height: 10 }];
		const packed = pack(rectangles, 10, 10);
		expect(packed).toEqual([[{ width: 10, height: 10, x: 0, y: 0, rotated: false }]]);
	});

	it('rectangles exactly fit the dimensions along x', () => {
		const rectangles = [
			{ width: 5, height: 10 },
			{ width: 5, height: 10 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(2);
		expect(packed[0]).toContainEqual({ width: 5, height: 10, x: 0, y: 0, rotated: false });
		expect(packed[0]).toContainEqual({ width: 5, height: 10, x: 5, y: 0, rotated: false });
	});

	it('rectangles exactly fit two bins along x', () => {
		const rectangles = [
			{ width: 5, height: 10 },
			{ width: 5, height: 10 },
			{ width: 5, height: 10 },
			{ width: 5, height: 10 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(2);
		expect(packed[0].length).toBe(2);
		expect(packed[1].length).toBe(2);
		expect(packed[0]).toContainEqual({ width: 5, height: 10, x: 0, y: 0, rotated: false });
		expect(packed[0]).toContainEqual({ width: 5, height: 10, x: 5, y: 0, rotated: false });
		expect(packed[1]).toContainEqual({ width: 5, height: 10, x: 0, y: 0, rotated: false });
		expect(packed[1]).toContainEqual({ width: 5, height: 10, x: 5, y: 0, rotated: false });
	});

	it('rectangles exactly fit the dimensions along y', () => {
		const rectangles = [
			{ width: 10, height: 5 },
			{ width: 10, height: 5 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(2);
		expect(packed[0]).toContainEqual({ width: 10, height: 5, x: 0, y: 0, rotated: false });
		expect(packed[0]).toContainEqual({ width: 10, height: 5, x: 0, y: 5, rotated: false });
	});

	it('two rectangles that require new bin', () => {
		const rectangles = [
			{ width: 7, height: 7 },
			{ width: 7, height: 7 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(2);
		expect(packed[0].length).toBe(1);
		expect(packed[1].length).toBe(1);
		expect(packed[0]).toContainEqual({ width: 7, height: 7, x: 0, y: 0, rotated: false });
		expect(packed[1]).toContainEqual({ width: 7, height: 7, x: 0, y: 0, rotated: false });
	});

	it('preserve data on rectangles', () => {
		const rectangles = [{ width: 5, height: 5, color: 'green' }];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(1);
		expect(packed[0]).toContainEqual({
			width: 5,
			height: 5,
			x: 0,
			y: 0,
			color: 'green',
			rotated: false
		});
	});

	it('border padding applied correctly', () => {
		const rectangles = [{ width: 5, height: 5 }];
		const border_padding = 2;
		const packed = pack(rectangles, 10, 10, { border_padding });
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(1);
		expect(packed[0][0]).toEqual({
			width: 5,
			height: 5,
			x: border_padding,
			y: border_padding,
			rotated: false
		});
	});

	it('rectangle padding applied correctly', () => {
		const rectangles = [
			{ width: 3, height: 5 },
			{ width: 3, height: 5 }
		];
		const rectangle_padding = 2;
		const packed = pack(rectangles, 10, 10, { rectangle_padding });
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(2);
		expect(packed[0]).toContainEqual({ width: 3, height: 5, x: 0, y: 0, rotated: false });
		expect(packed[0]).toContainEqual({
			width: 3,
			height: 5,
			x: 3 + rectangle_padding,
			y: 0,
			rotated: false
		});
	});

	it('3 rectangles that exactly fit, but not on the same row', () => {
		const rectangles = [
			{ width: 7, height: 5 },
			{ width: 10, height: 5 },
			{ width: 3, height: 5 }
		];
		const packed = pack(rectangles, 10, 10);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(3);
	});

	it('2 rectangles that fit if one is rotated', () => {
		const rectangles = [
			{ width: 7, height: 10 },
			{ width: 10, height: 3 }
		];
		const packed = pack(rectangles, 10, 10);
		console.log(packed);
		expect(packed.length).toBe(1);
		expect(packed[0].length).toBe(2);
		expect(packed[0].some((r) => r.rotated)).toBe(true);
	});
});
