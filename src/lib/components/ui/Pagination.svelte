<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	interface Props {
		currentPage: number;
		totalItems: number;
		pageSize?: number;
		onPageChange: (page: number) => void;
	}

	let { currentPage, totalItems, pageSize = 10, onPageChange }: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	const endItem = $derived(Math.min(totalItems, currentPage * pageSize));

	// Generate page number array for pagination bar
	const pageNumbers = $derived.by(() => {
		const pages: number[] = [];
		const maxVisible = 5;
		let start = Math.max(1, currentPage - 2);
		let end = Math.min(totalPages, start + maxVisible - 1);

		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	});
</script>

{#if totalItems > 0}
	<div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs">
		<!-- Summary Info -->
		<div class="text-slate-400 font-medium">
			Showing <span class="font-bold text-white">{startItem}</span> to <span class="font-bold text-white">{endItem}</span> of <span class="font-bold text-white">{totalItems}</span> entries
		</div>

		<!-- Pagination Buttons -->
		{#if totalPages > 1}
			<div class="flex items-center gap-1">
				<!-- Previous Button -->
				<button
					type="button"
					onclick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					aria-label="Previous Page"
					title="Previous Page"
					class="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-950"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>

				<!-- Page Numbers -->
				{#each pageNumbers as p}
					<button
						type="button"
						onclick={() => onPageChange(p)}
						aria-label={`Page ${p}`}
						class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer {currentPage === p
							? 'bg-emerald-500 text-slate-950 shadow-md'
							: 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}"
					>
						{p}
					</button>
				{/each}

				<!-- Next Button -->
				<button
					type="button"
					onclick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					aria-label="Next Page"
					title="Next Page"
					class="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-950"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		{/if}
	</div>
{/if}
