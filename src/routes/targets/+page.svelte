<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { targetsService } from '$lib/services/targets';
	import { categoriesService } from '$lib/services/categories';
	import type { SavingTarget, TargetStatus, TargetPriority } from '$lib/types/target';
	import TargetCard from '$lib/components/targets/TargetCard.svelte';
	import TargetModal from '$lib/components/targets/TargetModal.svelte';
	import { Target, Plus, Search, Loader2, ShieldAlert } from '@lucide/svelte';

	let { data } = $props();
	const queryClient = useQueryClient();

	let searchQuery = $state('');
	let statusFilter = $state<TargetStatus | 'all'>('all');
	let isModalOpen = $state(false);
	let targetToEdit = $state<SavingTarget | null>(null);
	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Fetch Targets
	const targetsQuery = createQuery(() => ({
		queryKey: ['saving_targets', data.user?.id, statusFilter],
		queryFn: () => targetsService.getTargets(statusFilter),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Active Categories for Modal Selection
	const categoriesQuery = createQuery(() => ({
		queryKey: ['saving_categories', data.user?.id, false],
		queryFn: () => categoriesService.getCategories(false),
		enabled: Boolean(data.user?.id)
	}));

	// Create Mutation
	const createMutationHandler = createMutation(() => ({
		mutationFn: (payload: any) => targetsService.createTarget(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			showToast('success', 'Savings goal target created successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to create savings goal.');
		}
	}));

	// Update Mutation
	const updateMutationHandler = createMutation(() => ({
		mutationFn: ({ id, payload }: { id: string; payload: any }) =>
			targetsService.updateTarget(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			showToast('success', 'Savings goal target updated successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to update savings goal.');
		}
	}));

	// Delete Mutation
	const deleteMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => targetsService.deleteTarget(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			showToast('success', 'Savings goal target deleted successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to delete goal.');
		}
	}));

	function showToast(type: 'success' | 'error', text: string) {
		toastMessage = { type, text };
		setTimeout(() => {
			if (toastMessage?.text === text) {
				toastMessage = null;
			}
		}, 5000);
	}

	function handleOpenCreate() {
		targetToEdit = null;
		isModalOpen = true;
	}

	function handleOpenEdit(target: SavingTarget) {
		targetToEdit = target;
		isModalOpen = true;
	}

	async function handleSaveTarget(payload: any) {
		if (targetToEdit) {
			await updateMutationHandler.mutateAsync({ id: targetToEdit.id, payload });
		} else {
			await createMutationHandler.mutateAsync(payload);
		}
	}

	async function handlePause(target: SavingTarget) {
		await updateMutationHandler.mutateAsync({ id: target.id, payload: { status: 'paused' } });
	}

	async function handleResume(target: SavingTarget) {
		await updateMutationHandler.mutateAsync({ id: target.id, payload: { status: 'active' } });
	}

	async function handleCancel(target: SavingTarget) {
		if (confirm(`Are you sure you want to cancel the goal "${target.title}"?`)) {
			await updateMutationHandler.mutateAsync({ id: target.id, payload: { status: 'cancelled' } });
		}
	}

	async function handleDelete(target: SavingTarget) {
		if (
			confirm(
				`Are you sure you want to delete "${target.title}"?\nNote: Goals with existing transactions cannot be deleted and must be set to Cancelled instead.`
			)
		) {
			await deleteMutationHandler.mutateAsync(target.id);
		}
	}

	// Filtered targets
	const filteredTargets = $derived.by(() => {
		const targets = targetsQuery.data || [];
		return targets.filter((t) =>
			t.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
		);
	});
</script>

<svelte:head>
	<title>Savings Goals - TargetMoneh</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
					<Target class="w-5 h-5" />
				</div>
				<h1 class="text-2xl font-bold text-white">Savings Goals</h1>
			</div>
			<p class="text-slate-400 text-xs mt-1">
				Track, edit, and prioritize monetary target goals and deadlines.
			</p>
		</div>

		{#if data.user}
			<button
				type="button"
				onclick={handleOpenCreate}
				class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
			>
				<Plus class="w-4 h-4" />
				<span>New Savings Goal</span>
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
			<button type="button" onclick={() => (toastMessage = null)} class="opacity-70 hover:opacity-100">✕</button>
		</div>
	{/if}

	{#if !data.user}
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
			<ShieldAlert class="w-8 h-8 text-amber-400 mx-auto" />
			<h3 class="font-bold text-white text-base">Authentication Required</h3>
			<p class="text-slate-400 text-xs max-w-sm mx-auto">
				Please sign in to view and manage your savings goals.
			</p>
			<a
				href="/auth"
				class="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
			>
				Sign In Now
			</a>
		</div>
	{:else}
		<!-- Controls Bar -->
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
			<!-- Search Input -->
			<div class="relative flex-1 max-w-sm">
				<Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search goal title..."
					class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
				/>
			</div>

			<!-- Status Filter Tabs -->
			<div class="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
				<button
					type="button"
					onclick={() => (statusFilter = 'all')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {statusFilter === 'all'
						? 'bg-slate-800 text-emerald-400'
						: 'text-slate-400 hover:text-slate-200'}"
				>
					All
				</button>
				<button
					type="button"
					onclick={() => (statusFilter = 'active')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {statusFilter === 'active'
						? 'bg-slate-800 text-emerald-400'
						: 'text-slate-400 hover:text-slate-200'}"
				>
					Active
				</button>
				<button
					type="button"
					onclick={() => (statusFilter = 'paused')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {statusFilter === 'paused'
						? 'bg-slate-800 text-emerald-400'
						: 'text-slate-400 hover:text-slate-200'}"
				>
					Paused
				</button>
				<button
					type="button"
					onclick={() => (statusFilter = 'cancelled')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {statusFilter === 'cancelled'
						? 'bg-slate-800 text-emerald-400'
						: 'text-slate-400 hover:text-slate-200'}"
				>
					Cancelled
				</button>
			</div>
		</div>

		<!-- List Content -->
		{#if targetsQuery.isLoading}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center gap-3">
				<Loader2 class="w-6 h-6 animate-spin text-emerald-400" />
				<span class="text-xs">Loading savings goals...</span>
			</div>
		{:else if targetsQuery.isError}
			<div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400 text-xs">
				Failed to load savings targets: {(targetsQuery.error as any)?.message || 'Unknown error'}
			</div>
		{:else if filteredTargets.length === 0}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
					<Target class="w-6 h-6" />
				</div>
				<h3 class="font-bold text-white text-base">No Goals Found</h3>
				<p class="text-slate-400 text-xs max-w-sm mx-auto">
					{#if searchQuery}
						No goals match your search term.
					{:else if statusFilter !== 'all'}
						No goals found for status "{statusFilter}".
					{:else}
						You haven't created any savings goals yet. Click "New Savings Goal" to define your monetary targets.
					{/if}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each filteredTargets as target (target.id)}
					<TargetCard
						{target}
						onEdit={handleOpenEdit}
						onPause={handlePause}
						onResume={handleResume}
						onCancel={handleCancel}
						onDelete={handleDelete}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Modal -->
<TargetModal
	isOpen={isModalOpen}
	{targetToEdit}
	categories={categoriesQuery.data || []}
	onClose={() => (isModalOpen = false)}
	onSave={handleSaveTarget}
/>
