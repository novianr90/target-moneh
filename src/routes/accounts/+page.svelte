<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { accountsService } from '$lib/services/accounts';
	import type { SavingAccount, AccountType } from '$lib/types/account';
	import AccountCard from '$lib/components/accounts/AccountCard.svelte';
	import AccountModal from '$lib/components/accounts/AccountModal.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { Landmark, Plus, Search, Filter, Loader2, Archive, ShieldAlert } from '@lucide/svelte';

	let { data } = $props();
	const queryClient = useQueryClient();

	let showArchived = $state(false);
	let searchQuery = $state('');
	let selectedTypeFilter = $state<AccountType | 'all'>('all');

	let isModalOpen = $state(false);
	let accountToEdit = $state<SavingAccount | null>(null);
	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Pagination State
	let currentPage = $state(1);
	const pageSize = 10;

	$effect(() => {
		searchQuery;
		selectedTypeFilter;
		showArchived;
		currentPage = 1;
	});

	// Fetch Accounts using TanStack Query
	const accountsQuery = createQuery(() => ({
		queryKey: ['saving_accounts', data.user?.id, showArchived],
		queryFn: () => accountsService.getAccounts(showArchived),
		enabled: Boolean(data.user?.id)
	}));

	// Create Mutation
	const createMutationHandler = createMutation(() => ({
		mutationFn: (payload: { name: string; type: AccountType }) => accountsService.createAccount(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_accounts'] });
			showToast('success', 'Source account created successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to create account.');
		}
	}));

	// Update Mutation
	const updateMutationHandler = createMutation(() => ({
		mutationFn: ({ id, payload }: { id: string; payload: { name: string; type: AccountType } }) =>
			accountsService.updateAccount(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_accounts'] });
			showToast('success', 'Source account updated successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to update account.');
		}
	}));

	// Archive Mutation
	const archiveMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => accountsService.archiveAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_accounts'] });
			showToast('success', 'Account archived successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to archive account.');
		}
	}));

	// Unarchive Mutation
	const unarchiveMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => accountsService.unarchiveAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_accounts'] });
			showToast('success', 'Account restored successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to restore account.');
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
		accountToEdit = null;
		isModalOpen = true;
	}

	function handleOpenEdit(account: SavingAccount) {
		accountToEdit = account;
		isModalOpen = true;
	}

	async function handleSaveAccount(payload: { name: string; type: AccountType }) {
		if (accountToEdit) {
			await updateMutationHandler.mutateAsync({ id: accountToEdit.id, payload });
		} else {
			await createMutationHandler.mutateAsync(payload);
		}
	}

	async function handleArchive(account: SavingAccount) {
		if (confirm(`Are you sure you want to archive "${account.name}"?\nArchived accounts remain in transaction history but cannot be picked for new transactions.`)) {
			await archiveMutationHandler.mutateAsync(account.id);
		}
	}

	async function handleUnarchive(account: SavingAccount) {
		await unarchiveMutationHandler.mutateAsync(account.id);
	}

	// Filtered list
	const filteredAccounts = $derived.by(() => {
		const accounts = accountsQuery.data || [];
		return accounts.filter((acc) => {
			const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
			const matchesType = selectedTypeFilter === 'all' || acc.type === selectedTypeFilter;
			return matchesSearch && matchesType;
		});
	});

	const paginatedAccounts = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredAccounts.slice(start, start + pageSize);
	});
</script>

<svelte:head>
	<title>Source Accounts - TargetMoneh</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
					<Landmark class="w-5 h-5" />
				</div>
				<h1 class="text-2xl font-bold text-white">Source Accounts</h1>
			</div>
			<p class="text-slate-400 text-xs mt-1">
				Manage bank accounts, e-wallets, and cash tags used to track savings allocations.
			</p>
		</div>

		{#if data.user}
			<button
				type="button"
				onclick={handleOpenCreate}
				class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
			>
				<Plus class="w-4 h-4" />
				<span>Add Source Account</span>
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
				Please sign in to view and manage your source accounts.
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
			<div class="flex-1 flex items-center gap-3">
				<!-- Search input -->
				<div class="relative flex-1 max-w-sm">
					<Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search account name..."
						class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
					/>
				</div>

				<!-- Type Filter -->
				<div class="relative">
					<select
						bind:value={selectedTypeFilter}
						class="px-4 pr-12 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
					>
						<option value="all">All Types</option>
						<option value="bank">Bank Accounts</option>
						<option value="wallet">E-Wallets</option>
						<option value="investment">Investments</option>
						<option value="cash">Cash / Physical</option>
					</select>
				</div>
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
		{#if accountsQuery.isLoading}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center gap-3">
				<Loader2 class="w-6 h-6 animate-spin text-emerald-400" />
				<span class="text-xs">Loading source accounts...</span>
			</div>
		{:else if accountsQuery.isError}
			<div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400 text-xs">
				Failed to load accounts: {(accountsQuery.error as any)?.message || 'Unknown error'}
			</div>
		{:else if filteredAccounts.length === 0}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
					<Landmark class="w-6 h-6" />
				</div>
				<h3 class="font-bold text-white text-base">No Accounts Found</h3>
				<p class="text-slate-400 text-xs max-w-sm mx-auto">
					{#if searchQuery || selectedTypeFilter !== 'all'}
						No source accounts match your filter criteria. Try clearing your search query.
					{:else if !showArchived}
						You haven't added any active source accounts yet. Click "Add Source Account" to create your first bank or wallet tag.
					{:else}
						No archived accounts found.
					{/if}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each paginatedAccounts as account (account.id)}
						<AccountCard
							{account}
							onEdit={handleOpenEdit}
							onArchive={handleArchive}
							onUnarchive={handleUnarchive}
						/>
					{/each}
				</div>

				<Pagination
					{currentPage}
					totalItems={filteredAccounts.length}
					{pageSize}
					onPageChange={(p) => (currentPage = p)}
				/>
			</div>
		{/if}
	{/if}
</div>

<!-- Modal -->
<AccountModal
	isOpen={isModalOpen}
	{accountToEdit}
	onClose={() => (isModalOpen = false)}
	onSave={handleSaveAccount}
/>
