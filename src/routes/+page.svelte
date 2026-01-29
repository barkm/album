<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Print from '$lib/components/Print.svelte';
	import Settings from '$lib/components/Settings.svelte';

	let images: { url: string; width: number; height: number }[] = $state([]);

	let resolution_pxcm = $state(200);
	let album_size_cm = $state({ width: 24.5, height: 23 });
	let paper_size_cm = $state({ width: 15, height: 10 });
	let page_layout: 'spread' | 'single' = $state('spread');

	let view = $state<'layout' | 'print' | 'settings'>('layout');
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
		<button
			class="rounded bg-gray-500 px-4 py-2 text-white opacity-50 disabled:opacity-100"
			onclick={() => (view = 'settings')}
			disabled={view === 'settings'}
		>
			Settings
		</button>
	</div>

	<!-- Hide components instead of removing to save state -->
	<div class={`${view === 'layout' ? 'block' : 'hidden'} w-full`}>
		<Layout
			width={album_size_cm.width * resolution_pxcm}
			height={album_size_cm.height * resolution_pxcm}
			max_image_side={0.3 * Math.max(album_size_cm.width, album_size_cm.height) * resolution_pxcm}
			bind:images
			{page_layout}
		/>
	</div>
	<div class={`${view === 'print' ? 'block' : 'hidden'} w-full`}>
		<Print
			width={paper_size_cm.width * resolution_pxcm}
			height={paper_size_cm.height * resolution_pxcm}
			{images}
		/>
	</div>
	<div class={`${view === 'settings' ? 'block' : 'hidden'} w-full`}>
		<Settings
			bind:resolution_px_per_cm={resolution_pxcm}
			bind:album_size_cm
			bind:paper_size_cm
			bind:page_layout
		/>
	</div>
</div>
