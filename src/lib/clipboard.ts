import { loadHtmlImage } from '$lib/image';

async function blobToPng(blob: Blob): Promise<Blob> {
	const url = URL.createObjectURL(blob);
	const img = await loadHtmlImage(url);
	URL.revokeObjectURL(url);

	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	canvas.getContext('2d')!.drawImage(img, 0, 0);

	return new Promise((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
	);
}

export async function copyImageToClipboard(blob: Blob) {
	const png = await blobToPng(blob);
	await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}
