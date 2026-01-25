<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Print from '$lib/components/Print.svelte';

	let images: { url: string; width: number; height: number }[] = $state([]);

	const resolution_pxcm = 100;

	const album_width_cm = 24.5;
	const album_height_cm = 23;

	const printer_width_cm = 15;
	const printer_height_cm = 10;

	let view = $state<'layout' | 'print'>('layout');
</script>

<div class="flex flex-col items-center justify-center bg-gray-600 p-10">
	<div class="mb-6 flex gap-4">
		<button
			class="rounded bg-gray-500 px-4 py-2 text-white opacity-50 disabled:opacity-100"
			onclick={() => (view = 'layout')}
			disabled={view === 'layout'}
		>
			Layout
		</button>
		<button
			class="rounded bg-gray-500 px-4 py-2 text-white opacity-50 disabled:opacity-100"
			onclick={() => (view = 'print')}
			disabled={view === 'print'}
		>
			Print
		</button>
	</div>

	<!-- Hide components instead of removing to save state -->
	<div class={`${view === 'layout' ? 'block' : 'hidden'} w-full`}>
		<Layout
			width={album_width_cm * resolution_pxcm}
			height={album_height_cm * resolution_pxcm}
			bind:images
		/>
	</div>
	<div class={`${view === 'print' ? 'block' : 'hidden'} w-full`}>
		<Print
			width={printer_width_cm * resolution_pxcm}
			height={printer_height_cm * resolution_pxcm}
			{images}
		/>
	</div>
</div>
