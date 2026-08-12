<script lang="ts">
	import type { SavingCategory } from '$lib/types/category';
	import CategoryIcon from './CategoryIcon.svelte';
	import { Edit2, Archive, ArchiveRestore } from '@lucide/svelte';

	interface Props {
		category: SavingCategory;
		onEdit: (category: SavingCategory) => void;
		onArchive: (category: SavingCategory) => void;
		onUnarchive: (category: SavingCategory) => void;
	}

	let { category, onEdit, onArchive, onUnarchive }: Props = $props();

	const isArchived = $derived(category.archived_at !== null);
</script>

<div
	class="bg-slate-900 border rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-slate-700 {isArchived
		? 'border-slate-800/60 opacity-60 bg-slate-900/40'
		: 'border-slate-800'}"
>
	<!-- Left Details -->
	<div class="flex items-center gap-3.5">
		<div
			class="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
			style="background-color: {category.color || '#10B981'};"
		>
			<CategoryIcon name={category.icon} class="w-5 h-5" />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<h4 class="font-bold text-white text-sm">{category.name}</h4>
				{#if isArchived}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
						Archived
					</span>
				{/if}
			</div>
			<div class="text-[11px] text-slate-500 mt-1">
				Created {new Date(category.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-1.5">
		{#if !isArchived}
			<button
				type="button"
				onclick={() => onEdit(category)}
				class="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
				title="Edit Category"
			>
				<Edit2 class="w-4 h-4" />
			</button>
			<button
				type="button"
				onclick={() => onArchive(category)}
				class="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
				title="Archive Category"
			>
				<Archive class="w-4 h-4" />
			</button>
		{:else}
			<button
				type="button"
				onclick={() => onUnarchive(category)}
				class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center gap-1.5 transition-colors"
				title="Restore Category"
			>
				<ArchiveRestore class="w-3.5 h-3.5" />
				<span>Restore</span>
			</button>
		{/if}
	</div>
</div>
