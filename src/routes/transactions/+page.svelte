<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { transactionsService } from '$lib/services/transactions';
	import { targetsService } from '$lib/services/targets';
	import { accountsService } from '$lib/services/accounts';
	import type { SavingTransaction } from '$lib/types/transaction';
	import RapidTransactionWidget from '$lib/components/transactions/RapidTransactionWidget.svelte';
	import TransactionTable from '$lib/components/transactions/TransactionTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { Zap, Search, Loader2, ShieldAlert, Filter } from '@lucide/svelte';

	let { data } = $props();
	const queryClient = useQueryClient();

	let selectedTargetFilter = $state('');
	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Pagination State
	let currentPage = $state(1);
	const pageSize = 10;

	$effect(() => {
		// Reset to page 1 whenever filter changes
		selectedTargetFilter;
		currentPage = 1;
	});

	// Fetch Transactions
	const transactionsQuery = createQuery(() => ({
		queryKey: ['saving_transactions', data.user?.id, selectedTargetFilter],
		queryFn: () => transactionsService.getTransactions(selectedTargetFilter || undefined),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Active Goals for Widget Selection
	const targetsQuery = createQuery(() => ({
		queryKey: ['saving_targets', data.user?.id, 'active'],
		queryFn: () => targetsService.getTargets('active'),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Active Source Accounts for Widget Selection
	const accountsQuery = createQuery(() => ({
		queryKey: ['saving_accounts', data.user?.id, false],
		queryFn: () => accountsService.getAccounts(false),
		enabled: Boolean(data.user?.id)
	}));

	// Create Transaction Mutation
	const createMutationHandler = createMutation(() => ({
		mutationFn: (payload: any) => transactionsService.createTransaction(payload),
		onSuccess: (tx) => {
			queryClient.invalidateQueries({ queryKey: ['saving_transactions'] });
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });

			const isDeposit = tx.transaction_type === 'deposit';
			const formatted = new Intl.NumberFormat('id-ID').format(tx.amount);
			showToast(
				'success',
				`Recorded ${isDeposit ? 'deposit (+)' : 'withdrawal (-)'} of Rp ${formatted} successfully.`
			);
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to record transaction.');
		}
	}));

	// Delete Transaction Mutation
	const deleteMutationHandler = createMutation(() => ({
		mutationFn: (id: string) => transactionsService.deleteTransaction(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_transactions'] });
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });
			showToast('success', 'Transaction entry deleted successfully.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Failed to delete transaction.');
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

	async function handleCreateTransaction(payload: any) {
		await createMutationHandler.mutateAsync(payload);
	}

	async function handleDeleteTransaction(tx: SavingTransaction) {
		if (
			confirm(
				`Are you sure you want to delete this ${tx.transaction_type} transaction of Rp ${new Intl.NumberFormat('id-ID').format(tx.amount)}?`
			)
		) {
			await deleteMutationHandler.mutateAsync(tx.id);
		}
	}

	const allTransactions = $derived(transactionsQuery.data || []);
	const paginatedTransactions = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return allTransactions.slice(start, start + pageSize);
	});
</script>

<svelte:head>
	<title>Rapid Savings Entries - TargetMoneh</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
					<Zap class="w-5 h-5" />
				</div>
				<h1 class="text-2xl font-bold text-white">Savings Transactions</h1>
			</div>
			<p class="text-slate-400 text-xs mt-1">
				Record rapid deposits and withdrawals towards your savings goals in under 10 seconds.
			</p>
		</div>
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
				Please sign in to record transactions and view your savings history.
			</p>
			<a
				href="/auth"
				class="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
			>
				Sign In Now
			</a>
		</div>
	{:else}
		<!-- Section 1: Rapid Transaction Widget (< 10 seconds entry) -->
		<RapidTransactionWidget
			targets={targetsQuery.data || []}
			accounts={accountsQuery.data || []}
			onSubmit={handleCreateTransaction}
		/>

		<!-- Section 2: Filter Bar -->
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-xs font-bold text-slate-300">
				<Filter class="w-4 h-4 text-emerald-400" />
				<span>Filter Transactions History</span>
			</div>

			<!-- Filter by Goal Target -->
			<div class="w-full sm:w-auto">
				<select
					bind:value={selectedTargetFilter}
					class="w-full sm:w-64 px-4 pr-12 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					<option value="">All Savings Goals</option>
					{#each (targetsQuery.data || []) as t}
						<option value={t.id}>{t.title}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Section 3: Transactions History Table + Pagination -->
		{#if transactionsQuery.isLoading}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center gap-3">
				<Loader2 class="w-6 h-6 animate-spin text-emerald-400" />
				<span class="text-xs">Loading transaction history...</span>
			</div>
		{:else if transactionsQuery.isError}
			<div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400 text-xs">
				Failed to load transactions: {(transactionsQuery.error as any)?.message || 'Unknown error'}
			</div>
		{:else if allTransactions.length === 0}
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
				<div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
					<Zap class="w-6 h-6" />
				</div>
				<h3 class="font-bold text-white text-base">No Transactions Found</h3>
				<p class="text-slate-400 text-xs max-w-sm mx-auto">
					{#if selectedTargetFilter}
						No deposits or withdrawals recorded for this specific goal target yet.
					{:else}
						You haven't recorded any savings deposits or withdrawals yet. Use the Rapid Entry widget above to log your first transaction.
					{/if}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				<TransactionTable
					transactions={paginatedTransactions}
					onDelete={handleDeleteTransaction}
				/>
				<Pagination
					{currentPage}
					totalItems={allTransactions.length}
					{pageSize}
					onPageChange={(p) => (currentPage = p)}
				/>
			</div>
		{/if}
	{/if}
</div>
