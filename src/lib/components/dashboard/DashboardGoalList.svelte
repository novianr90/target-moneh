<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import type { TargetBalance, SavingTransaction } from '$lib/types/transaction';
	import TargetCard from '$lib/components/targets/TargetCard.svelte';
	import { Target, Layers, ArrowRight } from '@lucide/svelte';

	interface Props {
		targets: SavingTarget[];
		balances: TargetBalance[];
		transactions: SavingTransaction[];
		onOpenDeposit: (target: SavingTarget) => void;
		onQuickDepositInline: (target: SavingTarget, amount: number) => Promise<void>;
		onEditTarget: (target: SavingTarget) => void;
		onPauseTarget: (target: SavingTarget) => void;
		onResumeTarget: (target: SavingTarget) => void;
		onCancelTarget: (target: SavingTarget) => void;
		onDeleteTarget: (target: SavingTarget) => void;
	}

	let {
		targets = [],
		balances = [],
		transactions = [],
		onOpenDeposit,
		onQuickDepositInline,
		onEditTarget,
		onPauseTarget,
		onResumeTarget,
		onCancelTarget,
		onDeleteTarget
	}: Props = $props();

	let filterMode = $state<'active' | 'all'>('active');

	const displayedTargets = $derived.by(() => {
		if (filterMode === 'active') {
			return targets.filter((t) => t.status === 'active');
		}
		return targets;
	});

	function getBalanceForTarget(targetId: string): TargetBalance | undefined {
		return balances.find((b) => b.target_id === targetId);
	}

	function getTransactionsForTarget(targetId: string): SavingTransaction[] {
		return transactions.filter((t) => t.target_id === targetId);
	}
</script>

<div class="space-y-4">
	<!-- Section Header & Filter Tabs -->
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
				<Target class="w-5 h-5" />
			</div>
			<div>
				<h3 class="font-extrabold text-white text-lg">Savings Goal Cards</h3>
				<p class="text-slate-400 text-xs">
					Goal metrics, health badges, velocity & required monthly savings
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
				<button
					type="button"
					onclick={() => (filterMode = 'active')}
					class="px-3 py-1 rounded-lg font-bold transition-all {filterMode === 'active'
						? 'bg-emerald-500 text-slate-950 shadow-sm'
						: 'text-slate-400 hover:text-white'}"
				>
					Active ({targets.filter((t) => t.status === 'active').length})
				</button>
				<button
					type="button"
					onclick={() => (filterMode = 'all')}
					class="px-3 py-1 rounded-lg font-bold transition-all {filterMode === 'all'
						? 'bg-emerald-500 text-slate-950 shadow-sm'
						: 'text-slate-400 hover:text-white'}"
				>
					All ({targets.length})
				</button>
			</div>

			<a
				href="/targets"
				class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
			>
				<span>Manage Goals</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</a>
		</div>
	</div>

	<!-- Goal Cards Grid -->
	{#if displayedTargets.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
			<Layers class="w-8 h-8 text-slate-600 mx-auto" />
			<p class="text-slate-400 text-xs font-medium">
				{filterMode === 'active'
					? 'No active savings goals found.'
					: 'No savings goals created yet.'}
			</p>
			<a
				href="/targets"
				class="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
			>
				+ Add Goal Target
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each displayedTargets as target (target.id)}
				<TargetCard
					{target}
					balance={getBalanceForTarget(target.id)}
					transactions={getTransactionsForTarget(target.id)}
					onEdit={onEditTarget}
					onPause={onPauseTarget}
					onResume={onResumeTarget}
					onCancel={onCancelTarget}
					onDelete={onDeleteTarget}
					onQuickDeposit={onQuickDepositInline}
				/>
			{/each}
		</div>
	{/if}
</div>
