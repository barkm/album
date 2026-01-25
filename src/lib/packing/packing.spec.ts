import { describe, it, expect } from 'vitest';
import { pack } from './packing';

describe('packing test', () => {
	it('no rectangles', () => {
		expect(pack([], 10, 10)).toEqual([]);
	});
});
