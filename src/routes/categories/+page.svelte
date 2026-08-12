<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { categoriesService } from '$lib/services/categories';
	import type { SavingCategory } from '$lib/types/category';
	import CategoryCard from '$lib/components/categories/CategoryCard.svelte';
	import CategoryModal from '$lib/components/categories/CategoryModal.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { PiggyBank, Plus, Search, Loader2, ShieldAlert } from '@lucide/svelte';

	let { data } = $props();
	const queryClient = useQueryClient();

	let showArchived = $state(false);
	let searchQuery = $state('');

	let isModalOpen = $state(false);
	let categoryToEdit = $state<SavingCategory | null>(null);
	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Pagination State
	let currentPage = $state(1);
	const pageSize = 10;

	$effect(() => {
		searchQuery;
		showArchived;
		currentPage = 1;
	});

	// Fetch Categories using TanStack Query
	const categoriesQuery = createQuery(() => ({
		queryKey: ['saving_categories', data.user?.id, showArchived],
		queryFn: () => categoriesService.getCategories(showArchived),
		enabled: Boolean(data.user?.id)
	}));

	// Create Mutation
	const createMutationHandler = createMutation(() => ({
		mutationFn: (payload: { name: string; icon?: string; color?: string }) =>
			categoriesService.createCategory(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_categories'] });
			showToast('success', 'Category created successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to create category.');
		}
	}));

	// Update Mutation
	const updateMutationHandler = createMutation(() => ({
		mutationFn: ({ id, payload }: { id: string; payload: { name?: string; icon?: string; color?: string } }) =>
			categoriesService.updateCategory(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_categories'] });
			showToast('success', 'Category updated successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to update category.');
		}
	}));

	// Archive Mutation
	const archiveMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => categoriesService.archiveCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_categories'] });
			showToast('success', 'Category archived successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to archive category.');
		}
	}));

	// Unarchive Mutation
	const unarchiveMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => categoriesService.unarchiveCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_categories'] });
			showToast('success', 'Category restored successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to restore category.');
		}
	}));

	function showToast(type: 'success' | 'error', text: string) {
		toastMessage = { type, text };
		setTimeout(() => {
			if (toastMessage?.text === text) {
				toastMessage = null;
			}
		}, 4000);
	}

	function handleOpenCreate() {
		categoryToEdit = null;
		isModalOpen = true;
	}

	function handleOpenEdit(category: SavingCategory) {
		categoryToEdit = category;
		isModalOpen = true;
	}

	async function handleSaveCategory(payload: { name: string; icon: string; color: string }) {
		if (categoryToEdit) {
			await updateMutationHandler.mutateAsync({ id: categoryToEdit.id, payload });
		} else {
			await createMutationHandler.mutateAsync(payload);
		}
	}

	async function handleArchive(category: SavingCategory) {
		if (
			confirm(
				`Are you sure you want to archive "${category.name}"?\nArchived categories remain attached to existing targets but cannot be selected for new targets.`
			)
		) {
			await archiveMutationHandler.mutateAsync(category.id);
		}
	}

	async function handleUnarchive(category: SavingCategory) {
		await unarchiveMutationHandler.mutateAsync(category.id);
	}

	// Filtered list
	const filteredCategories = $derived.by(() => {
		const categories = categoriesQuery.data || [];
		return categories.filter((cat) =>
			cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
		);
	});

	const paginatedCategories = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredCategories.slice(start, start + pageSize);
	});
</script>

<svelte:head>
	<title>Categories - TargetMoneh</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
					<PiggyBank class="w-5 h-5" />
				</div>
				<h1 class="text-2xl font-bold text-white">Categories</h1>
			</div>
			<p class="text-slate-400 text-xs mt-1">
				Organize your monetary targets by custom categories, icons, and badges.
			</p>
		</div>

		{#if data.user}
			<button
				type="button"
				onclick={handleOpenCreate}
				class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
			>
				<Plus class="w-4 h-4" />
				<span>Add Category</span>
			</button>
		{/if}
	</div>

	{#if toastMessage}
		<div
			class="p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition-all {toastMessage.type === 'success'
				? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
				: 'bg-rose-500/10 border-rose-500/30 text-rose-300'}"
		>
			<span>{toastMessage.text}</span>
			<button type="button" onclick={() => (toastMessage = null)} aria-label="Dismiss toast" class="opacity-70 hover:opacity-100">✕</button>
		</div>
	{/if}

	{#if !data.user}
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
			<ShieldAlert class="w-8 h-8 text-amber-400 mx-auto" />
			<h3 class="font-bold text-white text-base">Authentication Required</h3>
			<p class="text-slate-400 text-xs max-w-sm mx-auto">
				Please sign in to view and manage your categories.
			</p>
			<a
				href="/auth"
				class="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
			>
				Sign In Now
			</a>
		</div>
	{:else}
		<!-- Search & Filter Controls -->
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
			<!-- Search input -->
			<div class="relative flex-1 max-w-sm">
				<Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search category name..."
					class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
				/>
			</div>

			<!-- Archive Toggle -->
			<div class="flex items-center gap-2">
				<label class="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer select-none">
					<input
						type="checkbox"
						bind:checked={showArchived}
						class="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
					/>
					<span>Show Archived</span>
				</label>
			</div>
		</div>

		<!-- List Content + Pagination -->
		{#if categoriesQuery.isLoading}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center gap-3">
				<Loader2 class="w-6 h-6 animate-spin text-emerald-400" />
				<span class="text-xs">Loading categories...</span>
			</div>
		{:else if categoriesQuery.isError}
			<div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400 text-xs">
				Failed to load categories: {(categoriesQuery.error as any)?.message || 'Unknown error'}
			</div>
		{:else if filteredCategories.length === 0}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
					<PiggyBank class="w-6 h-6" />
				</div>
				<h3 class="font-bold text-white text-base">No Categories Found</h3>
				<p class="text-slate-400 text-xs max-w-sm mx-auto">
					{#if searchQuery}
						No categories match your search. Try clearing your search query.
					{:else if !showArchived}
						You haven't created any active categories yet. Click "Add Category" to create master data for your savings goals.
					{:else}
						No archived categories found.
					{/if}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each paginatedCategories as category (category.id)}
						<CategoryCard
							{category}
							onEdit={handleOpenEdit}
							onArchive={handleArchive}
							onUnarchive={handleUnarchive}
						/>
					{/each}
				</div>

				<Pagination
					{currentPage}
					totalItems={filteredCategories.length}
					{pageSize}
					onPageChange={(p) => (currentPage = p)}
				/>
			</div>
		{/if}
	{/if}
</div>

<!-- Modal -->
<CategoryModal
	isOpen={isModalOpen}
	{categoryToEdit}
	onClose={() => (isModalOpen = false)}
	onSave={handleSaveCategory}
/>
