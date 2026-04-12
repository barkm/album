<script lang="ts">
	let open = $state(false);
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') open = false; }} />

<button
	class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
	onclick={() => (open = true)}
	aria-label="Help"
>
	?
</button>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={() => (open = false)}
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="w-full max-w-md rounded-xl bg-gray-800 p-6 text-gray-100 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label="Help"
			tabindex="-1"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">How to use</h2>
				<button
					class="rounded p-1 text-gray-400 transition-colors hover:text-white"
					onclick={() => (open = false)}
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<p class="mb-4 text-sm text-gray-300">
				Drag &amp; drop or paste images onto the canvas. Click to select, drag to reposition, resize
				with handles. Use the <strong>Print</strong> tab to pack your images onto print-sized pages
				and download them as PNG files. Configure album size, paper dimensions, and padding in
				<strong>Settings</strong>.
			</p>

			<table class="w-full text-sm">
				<tbody class="divide-y divide-gray-700">
					{#each [
						['C', 'Enter crop mode'],
						['Enter', 'Confirm crop'],
						['Escape', 'Cancel crop'],
						['Backspace / Delete', 'Remove selected image'],
						['⌘C / Ctrl+C', 'Copy image to clipboard'],
						['⌘X / Ctrl+X', 'Cut image'],
						['⌘V / Ctrl+V', 'Paste image at cursor'],
						['⌘Z / Ctrl+Z', 'Undo'],
						['⌘⇧Z / Ctrl+Shift+Z', 'Redo'],
					] as [key, desc]}
						<tr>
							<td class="py-1.5 pr-4 font-mono text-xs whitespace-nowrap text-gray-400">{key}</td>
							<td class="py-1.5 text-gray-200">{desc}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
