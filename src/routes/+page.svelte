<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { transactionsService } from '$lib/services/transactions';
	import { targetsService } from '$lib/services/targets';
	import { accountsService } from '$lib/services/accounts';

	import HeroTargetCard from '$lib/components/dashboard/HeroTargetCard.svelte';
	import SavingsTimeline from '$lib/components/dashboard/SavingsTimeline.svelte';
	import DashboardGoalList from '$lib/components/dashboard/DashboardGoalList.svelte';
	import QuickDepositCard from '$lib/components/dashboard/QuickDepositCard.svelte';
	import RecentTransactionsCard from '$lib/components/dashboard/RecentTransactionsCard.svelte';
	import QuickDepositModal from '$lib/components/dashboard/QuickDepositModal.svelte';
	import QuickDepositFAB from '$lib/components/dashboard/QuickDepositFAB.svelte';
	import TargetModal from '$lib/components/targets/TargetModal.svelte';

	import type { SavingTarget } from '$lib/types/target';
	import { Target, Landmark, ArrowRight, TrendingUp, ShieldAlert, Sparkles } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const queryClient = useQueryClient();

	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Quick Deposit Modal State
	let isDepositModalOpen = $state(false);
	let selectedTargetForModal = $state<SavingTarget | undefined>(undefined);

	// Target Edit Modal State
	let isTargetModalOpen = $state(false);
	let editingTarget = $state<SavingTarget | null>(null);

	// Fetch Targets (All)
	const targetsQuery = createQuery(() => ({
		queryKey: ['saving_targets', data.user?.id],
		queryFn: () => targetsService.getTargets('all'),
		enabled: Boolean(data.user?.id)
	}));

	// Fetch Active Targets
	const activeTargets = $derived.by(() => {
		const all = targetsQuery.data || [];
		return all.filter((t) => t.status === 'active');
	});

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

	// Target Status Update Mutation
	const targetStatusMutation = createMutation(() => ({
		mutationFn: ({ id, status }: { id: string; status: any }) =>
			targetsService.updateTarget(id, { status }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });
			showToast('success', `Status target berhasil diubah ke ${variables.status}!`);
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Gagal mengubah status target.');
		}
	}));

	// Target Delete Mutation
	const targetDeleteMutation = createMutation(() => ({
		mutationFn: (id: string) => targetsService.deleteTarget(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });
			showToast('success', 'Target tabungan berhasil dihapus.');
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Gagal menghapus target.');
		}
	}));

	// Target Save Mutation (Create/Update)
	const targetSaveMutation = createMutation(() => ({
		mutationFn: (payload: any) => {
			if (editingTarget) {
				return targetsService.updateTarget(editingTarget.id, payload);
			}
			return targetsService.createTarget(payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['saving_targets'] });
			queryClient.invalidateQueries({ queryKey: ['v_saving_target_balances'] });
			showToast('success', `Goal target berhasil ${editingTarget ? 'diperbarui' : 'dibuat'}!`);
			isTargetModalOpen = false;
			editingTarget = null;
		},
		onError: (err: any) => {
			showToast('error', err.message || 'Gagal menyimpan target.');
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

	async function handleInlineQuickDeposit(target: SavingTarget, amount: number) {
		await depositMutationHandler.mutateAsync({
			target_id: target.id,
			amount,
			source_account_id: null,
			notes: 'Quick deposit from dashboard card'
		});
	}

	function openDepositModal(target?: SavingTarget) {
		selectedTargetForModal = target;
		isDepositModalOpen = true;
	}

	function handleEditTarget(target: SavingTarget) {
		editingTarget = target;
		isTargetModalOpen = true;
	}

	function handlePauseTarget(target: SavingTarget) {
		targetStatusMutation.mutate({ id: target.id, status: 'paused' });
	}

	function handleResumeTarget(target: SavingTarget) {
		targetStatusMutation.mutate({ id: target.id, status: 'active' });
	}

	function handleCancelTarget(target: SavingTarget) {
		if (confirm(`Apakah Anda yakin ingin membatalkan target "${target.title}"?`)) {
			targetStatusMutation.mutate({ id: target.id, status: 'cancelled' });
		}
	}

	function handleDeleteTarget(target: SavingTarget) {
		if (confirm(`Apakah Anda yakin ingin menghapus target "${target.title}"?`)) {
			targetDeleteMutation.mutate(target.id);
		}
	}

	async function handleSaveTargetModal(payload: any) {
		await targetSaveMutation.mutateAsync(payload);
	}

	// PRD Section 5.5: Total Active Goal Balance
	// "Sum of current_balance across all active targets only."
	const totalActiveBalance = $derived.by(() => {
		const balances = balancesQuery.data || [];
		const activeIds = new Set(activeTargets.map((t) => t.id));
		return balances
			.filter((b) => activeIds.has(b.target_id))
			.reduce((sum, b) => sum + (b.current_balance || 0), 0);
	});

	const totalActiveTargetAmount = $derived.by(() => {
		return activeTargets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
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

<div class="space-y-8 max-w-7xl mx-auto pb-12">
	{#if toastMessage}
		<div
			class="p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all shadow-lg {toastMessage.type ===
			'success'
				? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
				: 'bg-rose-500/10 border-rose-500/30 text-rose-300'}"
		>
			<span>{toastMessage.text}</span>
			<button
				type="button"
				onclick={() => (toastMessage = null)}
				aria-label="Dismiss toast"
				class="opacity-70 hover:opacity-100 font-bold px-2">✕</button
			>
		</div>
	{/if}

	{#if !data.user}
		<div
			class="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl"
		>
			<div
				class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400"
			>
				<Target class="w-8 h-8" />
			</div>
			<div class="space-y-2">
				<h2 class="text-2xl md:text-3xl font-extrabold text-white">Welcome to TargetMoneh</h2>
				<p class="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
					Personal savings goal tracker designed for rapid deposits in under 10 seconds. Sign in to
					track your targets, forecast deadlines, and view monthly savings velocity.
				</p>
			</div>
			<a
				href="/auth"
				class="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-xs md:text-sm font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
			>
				Sign In / Sign Up
			</a>
		</div>
	{:else}
		<!-- Header Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Total Active Goal Balance Card (PRD §5.5) -->
			<div
				class="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-xl"
			>
				<div
					class="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"
				></div>
				<div class="flex items-center justify-between">
					<span class="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
						Total Active Goal Balance
					</span>
					<TrendingUp class="w-5 h-5 text-emerald-400" />
				</div>
				<div class="text-3xl font-black text-white">{formatIDR(totalActiveBalance)}</div>
				<div class="text-xs text-slate-400">
					Active Goal Target: <span class="font-bold text-slate-200"
						>{formatIDR(totalActiveTargetAmount)}</span
					>
				</div>
			</div>

			<!-- Active Goals Count Card -->
			<div
				class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl flex flex-col justify-between"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Goals</span>
					<Target class="w-5 h-5 text-slate-400" />
				</div>
				<div class="text-3xl font-black text-white">{activeTargets.length} Active Goals</div>
				<a
					href="/targets"
					class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
				>
					<span>Manage All Goals ({targetsQuery.data?.length || 0})</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</a>
			</div>

			<!-- Master Accounts Count Card -->
			<div
				class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl flex flex-col justify-between"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Accounts</span>
					<Landmark class="w-5 h-5 text-slate-400" />
				</div>
				<div class="text-3xl font-black text-white">
					{(accountsQuery.data || []).length} Master Accounts
				</div>
				<a
					href="/accounts"
					class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
				>
					<span>Manage Accounts</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</a>
			</div>
		</div>

		<!-- Hero Target Featured Card -->
		<HeroTargetCard
			targets={targetsQuery.data || []}
			balances={balancesQuery.data || []}
			transactions={transactionsQuery.data || []}
			onOpenDeposit={openDepositModal}
		/>

		<!-- Savings Timeline Visualization Card (PRD §5.5 & §7.3) -->
		<SavingsTimeline
			transactions={transactionsQuery.data || []}
			targets={targetsQuery.data || []}
			balances={balancesQuery.data || []}
		/>

		<!-- Goal Cards Grid -->
		<DashboardGoalList
			targets={targetsQuery.data || []}
			balances={balancesQuery.data || []}
			transactions={transactionsQuery.data || []}
			onOpenDeposit={openDepositModal}
			onQuickDepositInline={handleInlineQuickDeposit}
			onEditTarget={handleEditTarget}
			onPauseTarget={handlePauseTarget}
			onResumeTarget={handleResumeTarget}
			onCancelTarget={handleCancelTarget}
			onDeleteTarget={handleDeleteTarget}
		/>

		<!-- Dashboard Quick Deposit & Recent Transactions Widgets -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<QuickDepositCard
				targets={activeTargets}
				accounts={accountsQuery.data || []}
				onDeposit={handleQuickDeposit}
			/>

			<RecentTransactionsCard transactions={transactionsQuery.data || []} />
		</div>

		<!-- Quick Deposit Floating Action Button (FAB) -->
		<QuickDepositFAB onClick={() => openDepositModal()} />

		<!-- Quick Deposit Modal -->
		<QuickDepositModal
			isOpen={isDepositModalOpen}
			targets={activeTargets}
			accounts={accountsQuery.data || []}
			selectedTargetId={selectedTargetForModal?.id}
			onClose={() => (isDepositModalOpen = false)}
			onDeposit={handleQuickDeposit}
		/>

		<!-- Target Edit Modal -->
		<TargetModal
			isOpen={isTargetModalOpen}
			targetToEdit={editingTarget}
			categories={[]}
			onClose={() => {
				isTargetModalOpen = false;
				editingTarget = null;
			}}
			onSave={handleSaveTargetModal}
		/>
	{/if}
</div>
