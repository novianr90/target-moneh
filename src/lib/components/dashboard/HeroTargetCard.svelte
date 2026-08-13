<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import { PRIORITY_LABELS } from '$lib/types/target';
	import type { TargetBalance, SavingTransaction } from '$lib/types/transaction';
	import { calculateGoalMetrics } from '$lib/engines';
	import { Target, Sparkles, TrendingUp, Calendar, Zap, ArrowUpRight, Award } from '@lucide/svelte';

	interface Props {
		targets: SavingTarget[];
		balances: TargetBalance[];
		transactions: SavingTransaction[];
		onOpenDeposit: (target?: SavingTarget) => void;
	}

	let { targets = [], balances = [], transactions = [], onOpenDeposit }: Props = $props();

	// Select highest-priority active goal as Hero Target
	// Priority rank: high (3) > medium (2) > low (1). Tie-breaker: closest target_date
	const heroTarget = $derived.by(() => {
		const activeTargets = targets.filter((t) => t.status === 'active');
		if (activeTargets.length === 0) return null;

		const priorityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };

		return [...activeTargets].sort((a, b) => {
			const pA = priorityRank[a.priority] || 2;
			const pB = priorityRank[b.priority] || 2;
			if (pA !== pB) return pB - pA;
			return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
		})[0];
	});

	const heroBalance = $derived.by(() => {
		if (!heroTarget) return 0;
		const b = balances.find((bal) => bal.target_id === heroTarget.id);
		return b?.current_balance || 0;
	});

	const heroTransactions = $derived.by(() => {
		if (!heroTarget) return [];
		return transactions.filter((tx) => tx.target_id === heroTarget.id);
	});

	const metrics = $derived.by(() => {
		if (!heroTarget) return null;
		return calculateGoalMetrics({
			id: heroTarget.id,
			title: heroTarget.title,
			target_amount: heroTarget.target_amount,
			start_date: heroTarget.start_date,
			target_date: heroTarget.target_date,
			status: heroTarget.status,
			current_balance: heroBalance,
			transactions: heroTransactions
		});
	});

	const priorityInfo = $derived(
		heroTarget ? PRIORITY_LABELS[heroTarget.priority] || PRIORITY_LABELS.medium : null
	);

	const progressPercent = $derived.by(() => {
		if (!heroTarget || heroTarget.target_amount <= 0) return 0;
		return Math.min(100, Math.round((heroBalance / heroTarget.target_amount) * 100));
	});

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

{#if heroTarget && metrics}
	<div
		class="relative overflow-hidden bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-950/40"
	>
		<!-- Background Glow Effects -->
		<div
			class="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
		></div>
		<div
			class="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 space-y-6">
			<!-- Header Badge & Top Meta -->
			<div class="flex items-center justify-between gap-4 flex-wrap">
				<div class="flex items-center gap-2">
					<div
						class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black tracking-wider uppercase"
					>
						<Award class="w-4 h-4 text-emerald-400" />
						<span>Hero Target</span>
					</div>

					{#if heroTarget.saving_categories}
						<div
							class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200"
						>
							<div
								class="w-2.5 h-2.5 rounded-full"
								style="background-color: {heroTarget.saving_categories.color || '#10B981'};"
							></div>
							<span>{heroTarget.saving_categories.name}</span>
						</div>
					{/if}

					{#if priorityInfo}
						<span
							class="px-2.5 py-0.5 rounded-full text-xs font-bold border {priorityInfo.colorClass}"
						>
							{priorityInfo.label}
						</span>
					{/if}
				</div>

				<!-- Health Badge -->
				<div
					class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-sm {metrics
						.health.colorClass}"
					title={metrics.health.description}
				>
					<span class="text-sm">{metrics.health.badge}</span>
					<span>{metrics.health.label}</span>
				</div>
			</div>

			<!-- Title & Main Balance Display -->
			<div class="space-y-2">
				<h2 class="text-2xl md:text-3xl font-extrabold text-white leading-tight">
					{heroTarget.title}
				</h2>
				{#if heroTarget.notes}
					<p class="text-slate-400 text-xs max-w-2xl leading-relaxed">{heroTarget.notes}</p>
				{/if}

				<div
					class="pt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-2"
				>
					<div>
						<span class="text-xs font-bold text-emerald-400 block uppercase tracking-wider"
							>Current Balance</span
						>
						<span class="text-3xl md:text-4xl font-black text-white"
							>{formatIDR(metrics.current_balance)}</span
						>
						<span class="text-sm font-semibold text-slate-400 ml-2"
							>of {formatIDR(metrics.target_amount)}</span
						>
					</div>

					<div class="text-left md:text-right">
						<span class="text-xs font-semibold text-slate-400 block">Remaining Gap</span>
						<span class="text-lg font-bold text-emerald-300"
							>{formatIDR(metrics.remaining_amount)}</span
						>
					</div>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="space-y-2">
				<div class="flex justify-between items-center text-xs font-bold">
					<span class="text-slate-300">Target Progress</span>
					<span class="text-emerald-400 text-sm font-black">{progressPercent}%</span>
				</div>
				<div class="w-full bg-slate-950/80 rounded-full h-3.5 p-0.5 border border-slate-800">
					<div
						class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/30"
						style="width: {progressPercent}%;"
					></div>
				</div>
			</div>

			<!-- Metrics Grid -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
				<div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
					<span class="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
						<Sparkles class="w-3.5 h-3.5 text-amber-400" />
						<span>Required / Month</span>
					</span>
					<div class="text-sm font-bold text-white">
						{#if metrics.required_monthly_savings === null}
							<span class="text-rose-400">N/A (Overdue)</span>
						{:else if metrics.required_monthly_savings === 0}
							<span class="text-emerald-400">Achieved</span>
						{:else}
							{formatIDR(metrics.required_monthly_savings)}
						{/if}
					</div>
				</div>

				<div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
					<span class="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
						<TrendingUp class="w-3.5 h-3.5 text-emerald-400" />
						<span>Savings Velocity</span>
					</span>
					<div class="text-sm font-bold text-emerald-400">
						{formatIDR(metrics.savings_velocity)}/mo
					</div>
				</div>

				<div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
					<span class="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
						<Calendar class="w-3.5 h-3.5 text-cyan-400" />
						<span>Target Deadline</span>
					</span>
					<div class="text-sm font-bold text-white">
						{new Date(heroTarget.target_date).toLocaleDateString('id-ID', {
							month: 'short',
							year: 'numeric'
						})}
					</div>
				</div>

				<div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
					<span class="text-[11px] font-semibold text-slate-400 block">Forecast Completion</span>
					<div class="text-sm font-bold text-emerald-300">
						{metrics.projected_completion_text}
					</div>
				</div>
			</div>

			<!-- Action CTA -->
			<div class="pt-2 flex items-center justify-end">
				<button
					type="button"
					onclick={() => onOpenDeposit(heroTarget)}
					class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
				>
					<Zap class="w-4 h-4 fill-slate-950" />
					<span>+ Quick Deposit to Hero Goal</span>
				</button>
			</div>
		</div>
	</div>
{:else}
	<div
		class="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl"
	>
		<div
			class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400"
		>
			<Target class="w-7 h-7" />
		</div>
		<div class="space-y-1">
			<h3 class="text-lg font-bold text-white">No Active Hero Goal Yet</h3>
			<p class="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
				Create your first active savings target to designate your Hero Goal and feature it on your
				dashboard.
			</p>
		</div>
		<a
			href="/targets"
			class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors shadow-lg shadow-emerald-500/20"
		>
			<span>+ Create Target Goal</span>
		</a>
	</div>
{/if}
