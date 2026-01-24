<script lang="ts">
	import Document from '$lib/components/Document.svelte';
	import Packing from '$lib/components/Packing.svelte';

	let images: { url: string; width: number; height: number }[] = $state([]);

	const resolution_pxcm = 100;

	const album_width_cm = 24.5;
	const album_height_cm = 23;

	const printer_width_cm = 15;
	const printer_height_cm = 10;
</script>

<div class="bg-gray-600 p-10">
	<Document
		width={album_width_cm * resolution_pxcm}
		height={album_height_cm * resolution_pxcm}
		bind:images
	/>
	<Packing
		width={printer_width_cm * resolution_pxcm}
		height={printer_height_cm * resolution_pxcm}
		{images}
	/>
</div>
