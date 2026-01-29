// db.ts
import { Dexie, type EntityTable } from 'dexie';

interface Image {
	id: string;
	page: number;
	data: Blob;
	width: number;
	height: number;
	x: number;
	y: number;
}

const db = new Dexie('ImagesDatabase') as Dexie & {
	images: EntityTable<
		Image,
		'id' // primary key "id" (for the typings only)
	>;
};

// Schema declaration:
db.version(1).stores({
	images: '++id, page, width, height, x, y' // primary key "id" (for the runtime!)
});

export type { Image };
export { db };
