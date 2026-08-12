<script lang="ts">
	import type { SavingCategory } from '$lib/types/category';
	import { CATEGORY_PRESET_COLORS, CATEGORY_ICON_OPTIONS } from '$lib/types/category';
	import CategoryIcon from './CategoryIcon.svelte';
	import { X, Loader2 } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		categoryToEdit?: SavingCategory | null;
		onClose: () => void;
		onSave: (data: { name: string; icon: string; color: string }) => Promise<void>;
	}

	let { isOpen, categoryToEdit = null, onClose, onSave }: Props = $props();

	let name = $state('');
	let icon = $state('piggy-bank');
	let color = $state('#10B981');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (isOpen) {
			if (categoryToEdit) {
				name = categoryToEdit.name;
				icon = categoryToEdit.icon || 'piggy-bank';
				color = categoryToEdit.color || '#10B981';
			} else {
				name = '';
				icon = 'piggy-bank';
				color = '#10B981';
			}
			errorMessage = null;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) {
			errorMessage = 'Category name is required.';
			return;
		}

		try {
			isSubmitting = true;
			errorMessage = null;
			await onSave({ name: name.trim(), icon, color });
			onClose();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to save category.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		role="button"
		tabindex="0"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<!-- Modal Card -->
		<div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<h3 class="text-lg font-bold text-white">
						{categoryToEdit ? 'Edit Category' : 'New Category'}
					</h3>
					<p class="text-slate-400 text-xs mt-0.5">
						Master category for organizing savings goals
					</p>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if errorMessage}
				<div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
					{errorMessage}
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-5">
				<!-- Preview Badge -->
				<div class="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
					<div
						class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all"
						style="background-color: {color};"
					>
						<CategoryIcon name={icon} class="w-5 h-5" />
					</div>
					<div>
						<div class="text-xs text-slate-400">Category Preview</div>
						<div class="font-bold text-sm text-white">{name.trim() || 'Category Name'}</div>
					</div>
				</div>

				<!-- Name Field -->
				<div class="space-y-1.5">
					<label for="category-name" class="block text-xs font-semibold text-slate-300"> Category Name </label>
					<input
						id="category-name"
						type="text"
						bind:value={name}
						placeholder="e.g. Emergency Fund, Vacation, DP Rumah"
						required
						disabled={isSubmitting}
						class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
					/>
				</div>

				<!-- Color Picker -->
				<div class="space-y-2">
					<span class="block text-xs font-semibold text-slate-300"> Category Color </span>
					<div class="flex flex-wrap gap-2.5 items-center">
						{#each CATEGORY_PRESET_COLORS as c}
							<button
								type="button"
								onclick={() => (color = c)}
								disabled={isSubmitting}
								aria-label={`Select color ${c}`}
								title={`Select color ${c}`}
								class="w-7 h-7 rounded-full border-2 transition-all cursor-pointer {color === c
									? 'border-white scale-110 shadow-lg'
									: 'border-transparent hover:scale-105'}"
								style="background-color: {c};"
							></button>
						{/each}
						<input
							type="color"
							bind:value={color}
							disabled={isSubmitting}
							class="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer p-0"
							title="Custom Color"
						/>
					</div>
				</div>

				<!-- Icon Selector -->
				<div class="space-y-2">
					<span class="block text-xs font-semibold text-slate-300"> Icon </span>
					<div class="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/40">
						{#each CATEGORY_ICON_OPTIONS as opt}
							{@const isSelected = icon === opt.id}
							<button
								type="button"
								onclick={() => (icon = opt.id)}
								disabled={isSubmitting}
								title={opt.label}
								class="p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer {isSelected
									? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
									: 'border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 bg-slate-900/60'}"
							>
								<CategoryIcon name={opt.id} class="w-5 h-5" />
							</button>
						{/each}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={onClose}
						disabled={isSubmitting}
						class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 transition-colors disabled:opacity-50"
					>
						{#if isSubmitting}
							<Loader2 class="w-3.5 h-3.5 animate-spin" />
							<span>Saving...</span>
						{:else}
							<span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
