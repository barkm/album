<script lang="ts">
	interface Props {
		resolution_px_per_cm: number;
		album_size_cm: { width: number; height: number };
		paper_size_cm: { width: number; height: number };
	}

	let {
		resolution_px_per_cm = $bindable(200),
		album_size_cm = $bindable({ width: 24.5, height: 23 }),
		paper_size_cm = $bindable({ width: 15, height: 10 })
	}: Props = $props();

	let draft_resolution_px_per_cm = $state(resolution_px_per_cm);
	let draft_album_size_cm = $state({ ...album_size_cm });
	let draft_paper_size_cm = $state({ ...paper_size_cm });

	function save_settings() {
		resolution_px_per_cm = draft_resolution_px_per_cm;
		album_size_cm = { ...draft_album_size_cm };
		paper_size_cm = { ...draft_paper_size_cm };
	}

	function cancel_changes() {
		draft_resolution_px_per_cm = resolution_px_per_cm;
		draft_album_size_cm = { ...album_size_cm };
		draft_paper_size_cm = { ...paper_size_cm };
	}

	function has_changes() {
		return (
			draft_resolution_px_per_cm !== resolution_px_per_cm ||
			draft_album_size_cm.width !== album_size_cm.width ||
			draft_album_size_cm.height !== album_size_cm.height ||
			draft_paper_size_cm.width !== paper_size_cm.width ||
			draft_paper_size_cm.height !== paper_size_cm.height
		);
	}
</script>

<div class="min-h-screen w-full text-white">
	<div class="mb-6 space-y-4">
		<label class="block">
			<span class="block text-sm font-medium">Resolution (px/cm)</span>
			<input
				class="mt-1 w-40 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
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
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_album_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
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
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_paper_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
					type="number"
					min="1"
					step="0.1"
					bind:value={draft_paper_size_cm.height}
				/>
			</div>
		</div>
	</div>

	<div class="flex gap-2">
		<button
			class="rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
			type="button"
			onclick={save_settings}
			disabled={!has_changes()}
			class:opacity-50={!has_changes()}
			class:cursor-not-allowed={!has_changes()}
		>
			Save
		</button>
		<button
			class="rounded border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
			type="button"
			onclick={cancel_changes}
			disabled={!has_changes()}
			class:opacity-50={!has_changes()}
			class:cursor-not-allowed={!has_changes()}
		>
			Cancel
		</button>
	</div>
</div>
