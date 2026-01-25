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
				bind:value={resolution_px_per_cm}
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
					bind:value={album_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
					type="number"
					min="1"
					step="0.1"
					bind:value={album_size_cm.height}
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
					bind:value={paper_size_cm.width}
				/>
				<input
					class="w-24 rounded border border-white/20 bg-white/5 px-3 py-1 text-white"
					type="number"
					min="1"
					step="0.1"
					bind:value={paper_size_cm.height}
				/>
			</div>
		</div>
	</div>
</div>
