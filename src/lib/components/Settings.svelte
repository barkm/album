<script lang="ts">
	interface Props {
		resolution_px_per_cm: number;
		album_size_cm: { width: number; height: number };
		paper_size_cm: { width: number; height: number };
		page_layout: 'spread' | 'single';
		border_padding: number;
		image_padding: number;
	}

	let {
		resolution_px_per_cm = $bindable(200),
		album_size_cm = $bindable({ width: 24.5, height: 23 }),
		paper_size_cm = $bindable({ width: 15, height: 10 }),
		page_layout = $bindable('spread'),
		border_padding = $bindable(10),
		image_padding = $bindable(10)
	}: Props = $props();

	let draft_resolution_px_per_cm = $state(resolution_px_per_cm);
	let draft_album_size_cm = $state({ ...album_size_cm });
	let draft_paper_size_cm = $state({ ...paper_size_cm });
	let draft_page_layout = $state(page_layout);
	let draft_border_padding = $state(border_padding);
	let draft_image_padding = $state(image_padding);

	function save_settings() {
		resolution_px_per_cm = draft_resolution_px_per_cm;
		album_size_cm = { ...draft_album_size_cm };
		paper_size_cm = { ...draft_paper_size_cm };
		page_layout = draft_page_layout;
		border_padding = draft_border_padding;
		image_padding = draft_image_padding;
	}

	function cancel_changes() {
		draft_resolution_px_per_cm = resolution_px_per_cm;
		draft_album_size_cm = { ...album_size_cm };
		draft_paper_size_cm = { ...paper_size_cm };
		draft_page_layout = page_layout;
		draft_border_padding = border_padding;
		draft_image_padding = image_padding;
	}

	function has_changes() {
		return (
			draft_resolution_px_per_cm !== resolution_px_per_cm ||
			draft_album_size_cm.width !== album_size_cm.width ||
			draft_album_size_cm.height !== album_size_cm.height ||
			draft_paper_size_cm.width !== paper_size_cm.width ||
			draft_paper_size_cm.height !== paper_size_cm.height ||
			draft_page_layout !== page_layout ||
			draft_border_padding !== border_padding ||
			draft_image_padding !== image_padding
		);
	}
</script>

<div class="text-white">
	<div class="mb-6 space-y-4">
		<label class="block">
			<span class="block text-sm font-medium">Resolution (px/cm)</span>
			<input
				class="mt-1 w-40 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
				type="number"
				min="1"
				step="1"
				bind:value={draft_resolution_px_per_cm}
			/>
		</label>

		<div>
			<span class="block text-sm font-medium">Album size (cm)</span>
			<div class="mt-1 flex gap-2">
				<input
					class="w-24 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_album_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_album_size_cm.height}
				/>
			</div>
		</div>

		<div>
			<span class="block text-sm font-medium">Paper size (cm)</span>
			<div class="mt-1 flex gap-2">
				<input
					class="w-24 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_paper_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_paper_size_cm.height}
				/>
			</div>
		</div>

		<div>
			<span class="block text-sm font-medium">Border padding (px)</span>
			<input
				class="mt-1 w-40 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
				type="number"
				min="0"
				step="1"
				bind:value={draft_border_padding}
			/>
		</div>

		<div>
			<span class="block text-sm font-medium">Image padding (px)</span>
			<input
				class="mt-1 w-40 rounded border border-gray-500 bg-gray-700 px-3 py-1 text-white focus:border-gray-400 focus:outline-none"
				type="number"
				min="0"
				step="1"
				bind:value={draft_image_padding}
			/>
		</div>

		<div>
			<span class="block text-sm font-medium">Page layout</span>
			<div class="mt-1 flex rounded-lg bg-gray-700 p-1 gap-1 w-fit">
				<button
					type="button"
					class="rounded px-4 py-1 text-sm font-medium transition-colors {draft_page_layout === 'single' ? 'bg-white text-gray-900 shadow' : 'text-gray-300 hover:text-white'}"
					onclick={() => (draft_page_layout = 'single')}
				>
					Single
				</button>
				<button
					type="button"
					class="rounded px-4 py-1 text-sm font-medium transition-colors {draft_page_layout === 'spread' ? 'bg-white text-gray-900 shadow' : 'text-gray-300 hover:text-white'}"
					onclick={() => (draft_page_layout = 'spread')}
				>
					Spread
				</button>
			</div>
		</div>
	</div>

	<div class="flex gap-2">
		<button
			class="rounded px-4 py-2 text-sm font-medium transition-colors {has_changes() ? 'bg-white text-gray-900 shadow' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}"
			type="button"
			onclick={save_settings}
			disabled={!has_changes()}
		>
			Save
		</button>
		<button
			class="rounded px-4 py-2 text-sm font-medium transition-colors {has_changes() ? 'bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}"
			type="button"
			onclick={cancel_changes}
			disabled={!has_changes()}
		>
			Cancel
		</button>
	</div>
</div>
