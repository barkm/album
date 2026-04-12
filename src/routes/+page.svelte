<script lang="ts">
	import HelpModal from '$lib/components/HelpModal.svelte';
	import Layout from '$lib/components/Layout.svelte';
	import Print from '$lib/components/Print.svelte';
	import Settings from '$lib/components/Settings.svelte';

	let images: {
		url: string;
		width: number;
		height: number;
		naturalWidth: number;
		naturalHeight: number;
		cropX?: number;
		cropY?: number;
		cropWidth?: number;
		cropHeight?: number;
	}[] = $state([]);

	let resolution_pxcm = $state(200);
	let album_size_cm = $state({ width: 24.5, height: 23 });
	let paper_size_cm = $state({ width: 15, height: 10 });
	let page_layout: 'spread' | 'single' = $state('spread');
	let border_padding = $state(10);
	let image_padding = $state(10);

	let view = $state<'layout' | 'print' | 'settings'>('layout');

	const tabs: { id: 'layout' | 'print' | 'settings'; label: string; tip: string }[] = [
		{ id: 'layout', label: 'Layout', tip: 'Arrange photos on album pages' },
		{ id: 'print', label: 'Print', tip: 'Pack and download print-ready pages' },
		{ id: 'settings', label: 'Settings', tip: 'Configure dimensions and padding' }
	];
</script>

<div class="flex flex-col items-center justify-center bg-gray-600 p-10">
	<div class="relative mb-6 flex w-full items-center justify-center">
		<div class="flex gap-1 rounded-lg bg-gray-700 p-1">
			{#each tabs as tab}
				<button
					class="group relative rounded px-4 py-2 text-sm font-medium transition-colors {view ===
					tab.id
						? 'bg-white text-gray-900 shadow'
						: 'text-gray-300 hover:text-white'}"
					onclick={() => (view = tab.id)}
				>
					{tab.label}
					<span
						class="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-gray-200 opacity-0 transition-opacity group-hover:opacity-100"
					>
						{tab.tip}
					</span>
				</button>
			{/each}
		</div>
		<div class="absolute right-0">
			<HelpModal />
		</div>
	</div>

	<!-- Hide components instead of removing to save state -->
	<div class={`${view === 'layout' ? 'block' : 'hidden'} w-full`}>
		<Layout
			width={album_size_cm.width * resolution_pxcm}
			height={album_size_cm.height * resolution_pxcm}
			max_image_side={{
				long:
					Math.max(paper_size_cm.width, paper_size_cm.height) * resolution_pxcm -
					2 * border_padding,
				short:
					Math.min(paper_size_cm.width, paper_size_cm.height) * resolution_pxcm - 2 * border_padding
			}}
			bind:images
			{page_layout}
		/>
	</div>
	<div class={`${view === 'print' ? 'block' : 'hidden'} w-full`}>
		<Print
			width={paper_size_cm.width * resolution_pxcm}
			height={paper_size_cm.height * resolution_pxcm}
			{images}
			{border_padding}
			{image_padding}
		/>
	</div>
	<div class={`${view === 'settings' ? 'block' : 'hidden'} w-full`}>
		<Settings
			bind:resolution_px_per_cm={resolution_pxcm}
			bind:album_size_cm
			bind:paper_size_cm
			bind:page_layout
			bind:border_padding
			bind:image_padding
		/>
	</div>
</div>
