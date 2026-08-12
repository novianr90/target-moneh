<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { transactionsService } from '$lib/services/transactions';
	import { targetsService } from '$lib/services/targets';
	import { accountsService } from '$lib/services/accounts';
	import QuickDepositCard from '$lib/components/dashboard/QuickDepositCard.svelte';
	import RecentTransactionsCard from '$lib/components/dashboard/RecentTransactionsCard.svelte';
	import { Target, Zap, Landmark, PiggyBank, ArrowRight, ShieldAlert, TrendingUp } from '@lucide/svelte';

	let { data } = $props();
	const queryClient = useQueryClient();

	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Fetch Active Goals
	const targetsQuery = createQuery(() => ({
		queryKey: ['saving_targets', data.user?.id, 'active'],
		queryFn: () => targetsService.getTargets('active'),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Accounts
	const accountsQuery = createQuery(() => ({
		queryKey: ['saving_accounts', data.user?.id, false],
		queryFn: () => accountsService.getAccounts(false),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Recent Transactions
	const transactionsQuery = createQuery(() => ({
		queryKey: ['saving_transactions', data.user?.id],
		queryFn: () => transactionsService.getTransactions(),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Target Balances View
	const balancesQuery = createQuery(() => ({
		queryKey: ['v_saving_target_balances', data.user?.id],
		queryFn: () => transactionsService.getTargetBalances(),
		enabled: Boolean(data.user?.id)
	}));

	// Quick Deposit Mutation
	const depositMutationHandler = createMutation(() => ({
		mutationFn: (payload: any) =>
			transactionsService.createTransaction({
				...payload,
				transaction_type: 'deposit'
			}),
		onSuccess: (tx) => {
			queryClient.invalidateQueries({ queryKey: ['saving_transactions'] });
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });
			const formatted = new Intl.NumberFormat('id-ID').format(tx.amount);
			showToast('success', `Berhasil menyetor Rp ${formatted} ke tabungan! 🎉`);
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Gagal menyetor tabungan.');
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

	async function handleQuickDeposit(payload: any) {
		await depositMutationHandler.mutateAsync(payload);
	}

	// Calculated Stats
	const totalCollected = $derived.by(() => {
		const balances = balancesQuery.data || [];
		return balances.reduce((sum, b) => sum + (b.current_balance || 0), 0);
	});

	const totalTargetAmount = $derived.by(() => {
		const targets = targetsQuery.data || [];
		return targets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
	});

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Dashboard - TargetMoneh</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
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
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
			<div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
				<Target class="w-6 h-6" />
			</div>
			<h2 class="text-xl font-extrabold text-white">Welcome to TargetMoneh</h2>
			<p class="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
				Personal savings goal tracker designed for rapid deposits in under 10 seconds. Sign in to start tracking your targets.
			</p>
			<a
				href="/auth"
				class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
			>
				Sign In / Sign Up
			</a>
		</div>
	{:else}
		<!-- Header Banner & Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Total Savings Balance Card -->
			<div class="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-xl">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-emerald-400">Total Savings Collected</span>
					<TrendingUp class="w-4 h-4 text-emerald-400" />
				</div>
				<div class="text-2xl font-extrabold text-white">{formatIDR(totalCollected)}</div>
				<div class="text-[11px] text-slate-400">
					Target Total: <span class="font-bold text-slate-200">{formatIDR(totalTargetAmount)}</span>
				</div>
			</div>

			<!-- Active Goals Count Card -->
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl flex flex-col justify-between">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-slate-400">Active Goals</span>
					<Target class="w-4 h-4 text-slate-400" />
				</div>
				<div class="text-2xl font-extrabold text-white">{(targetsQuery.data || []).length} Goals</div>
				<a href="/targets" class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
					<span>Manage Goals</span>
					<ArrowRight class="w-3 h-3" />
				</a>
			</div>

			<!-- Source Accounts Count Card -->
			<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl flex flex-col justify-between">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-slate-400">Master Accounts</span>
					<Landmark class="w-4 h-4 text-slate-400" />
				</div>
				<div class="text-2xl font-extrabold text-white">{(accountsQuery.data || []).length} Accounts</div>
				<a href="/accounts" class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
					<span>Manage Accounts</span>
					<ArrowRight class="w-3 h-3" />
				</a>
			</div>
		</div>

		<!-- Main Section: Quick Deposit Widget + Recent Activity -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Quick Savings Insert Widget (Main Dashboard) -->
			<QuickDepositCard
				targets={targetsQuery.data || []}
				accounts={accountsQuery.data || []}
				onDeposit={handleQuickDeposit}
			/>

			<!-- Recent Activity List -->
			<RecentTransactionsCard
				transactions={transactionsQuery.data || []}
			/>
		</div>
	{/if}
</div>
