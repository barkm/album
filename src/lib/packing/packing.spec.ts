import { describe, it, expect } from 'vitest';
import { pack } from './packing';

describe('packing test', () => {
	it('no rectangles', () => {
		expect(pack([], 10, 10)).toEqual([]);
	});

	it('single rectangle fits', () => {
		const rectangles = [{ width: 5, height: 5 }];
		expect(pack(rectangles, 10, 10)).toEqual([rectangles]);
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
		expect(pack(rectangles, 10, 10)).toEqual([rectangles]);
	});
});
