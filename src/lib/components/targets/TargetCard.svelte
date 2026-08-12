<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import { PRIORITY_LABELS, STATUS_LABELS } from '$lib/types/target';
	import type { TargetBalance, SavingTransaction } from '$lib/types/transaction';
	import { calculateGoalMetrics } from '$lib/engines';
	import CategoryIcon from '$lib/components/categories/CategoryIcon.svelte';
	import { Target, Calendar, Edit2, Pause, Play, Trash2, Ban, Plus, Loader2, TrendingUp, Sparkles } from '@lucide/svelte';

	interface Props {
		target: SavingTarget;
		balance?: TargetBalance;
		transactions?: SavingTransaction[];
		onEdit: (target: SavingTarget) => void;
		onPause: (target: SavingTarget) => void;
		onResume: (target: SavingTarget) => void;
		onCancel: (target: SavingTarget) => void;
		onDelete: (target: SavingTarget) => void;
		onQuickDeposit?: (target: SavingTarget, amount: number) => Promise<void>;
	}

	let { target, balance, transactions = [], onEdit, onPause, onResume, onCancel, onDelete, onQuickDeposit }: Props = $props();

	let quickAmountStr = $state('');
	let isSubmittingDeposit = $state(false);

	const priorityInfo = $derived(PRIORITY_LABELS[target.priority] || PRIORITY_LABELS.medium);
	const statusInfo = $derived(STATUS_LABELS[target.status] || STATUS_LABELS.active);
	const category = $derived(target.saving_categories);

	const metrics = $derived.by(() => {
		return calculateGoalMetrics({
			id: target.id,
			title: target.title,
			target_amount: target.target_amount,
			start_date: target.start_date,
			target_date: target.target_date,
			status: target.status,
			current_balance: balance?.current_balance || 0,
			transactions: transactions || []
		});
	});

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatIDRInput(value: string): string {
		const raw = value.replace(/\D/g, '');
		if (!raw) return '';
		return new Intl.NumberFormat('id-ID').format(Number(raw));
	}

	function handleAmountInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const rawDigits = input.value.replace(/\D/g, '');
		quickAmountStr = rawDigits;
	}

	async function handleQuickDepositSubmit(e: SubmitEvent) {
		e.preventDefault();
		const amount = Number(quickAmountStr);
		if (!amount || amount <= 0 || !onQuickDeposit) return;

		try {
			isSubmittingDeposit = true;
			await onQuickDeposit(target, amount);
			quickAmountStr = '';
		} catch (err) {
			console.error('Quick deposit error:', err);
		} finally {
			isSubmittingDeposit = false;
		}
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 transition-all hover:border-slate-700 flex flex-col justify-between">
	<!-- Top Bar: Category & Status/Priority Badges -->
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-center gap-2 flex-wrap">
			{#if category}
				<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-200">
					<div
						class="w-2.5 h-2.5 rounded-full"
						style="background-color: {category.color || '#10B981'};"
					></div>
					<span>{category.name}</span>
				</div>
			{:else}
				<span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950/60 border border-slate-800 text-slate-500">
					Uncategorized
				</span>
			{/if}

			<span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border {priorityInfo.colorClass}">
				{priorityInfo.label}
			</span>
		</div>

		<div class="flex items-center gap-1.5 flex-wrap">
			<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 {metrics.health.colorClass}">
				<span>{metrics.health.badge}</span>
				<span>{metrics.health.label}</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold border {statusInfo.colorClass}">
				{statusInfo.label}
			</span>
		</div>
	</div>

	<!-- Main Details -->
	<div class="space-y-1.5">
		<h3 class="font-bold text-white text-lg leading-snug">{target.title}</h3>
		{#if target.notes}
			<p class="text-slate-400 text-xs line-clamp-2">{target.notes}</p>
		{/if}
	</div>

	<!-- Recommendation Engine Metrics Summary -->
	<div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-slate-400 flex items-center gap-1">
				<Sparkles class="w-3.5 h-3.5 text-amber-400" />
				<span>Required / Bln</span>
			</span>
			<span class="font-bold text-slate-200">
				{#if metrics.required_monthly_savings === null}
					<span class="text-rose-400 font-semibold">N/A (Overdue)</span>
				{:else if metrics.required_monthly_savings === 0}
					<span class="text-emerald-400 font-bold">Achieved</span>
				{:else}
					{formatIDR(metrics.required_monthly_savings)}
				{/if}
			</span>
		</div>

		<div class="flex items-center justify-between text-xs">
			<span class="text-slate-400 flex items-center gap-1">
				<TrendingUp class="w-3.5 h-3.5 text-emerald-400" />
				<span>Savings Velocity</span>
			</span>
			<span class="font-bold text-emerald-400">
				{formatIDR(metrics.savings_velocity)}/bln ({metrics.velocity_months_count} bln)
			</span>
		</div>

		<div class="flex items-center justify-between text-xs">
			<span class="text-slate-400">Projected Completion</span>
			<span class="font-semibold text-slate-300">
				{metrics.projected_completion_text}
			</span>
		</div>
	</div>

	<!-- Target Amount & Deadline -->
	<div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
		<div>
			<span class="text-[11px] font-medium text-slate-500 block">Target Amount</span>
			<span class="text-emerald-400 font-extrabold text-lg">{formatIDR(target.target_amount)}</span>
		</div>

		<div class="text-right">
			<span class="text-[11px] font-medium text-slate-500 block flex items-center justify-end gap-1">
				<Calendar class="w-3 h-3 text-slate-500" />
				<span>Deadline</span>
			</span>
			<span class="text-slate-200 font-semibold text-xs">
				{new Date(target.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
			</span>
		</div>
	</div>

	<!-- Direct Inline Quick Deposit Input (No Modal Required) -->
	{#if onQuickDeposit && target.status === 'active'}
		<form onsubmit={handleQuickDepositSubmit} class="flex items-center gap-2 pt-2 border-t border-slate-800/60">
			<div class="relative flex-1">
				<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-400">Rp</span>
				<input
					type="text"
					value={formatIDRInput(quickAmountStr)}
					oninput={handleAmountInput}
					disabled={isSubmittingDeposit}
					placeholder="Nominal simpanan..."
					class="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs font-bold focus:outline-none focus:border-emerald-500"
				/>
			</div>
			<button
				type="submit"
				disabled={isSubmittingDeposit || !quickAmountStr}
				class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-40"
			>
				{#if isSubmittingDeposit}
					<Loader2 class="w-3.5 h-3.5 animate-spin" />
				{:else}
					<Plus class="w-3.5 h-3.5" />
					<span>Nabung</span>
				{/if}
			</button>
		</form>
	{/if}

	<!-- Action Footer -->
	<div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
		<button
			type="button"
			onclick={() => onEdit(target)}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
		>
			<Edit2 class="w-3.5 h-3.5" />
			<span>Edit</span>
		</button>

		<div class="flex items-center gap-1">
			{#if target.status === 'active'}
				<button
					type="button"
					onclick={() => onPause(target)}
					class="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
					title="Pause Goal"
				>
					<Pause class="w-4 h-4" />
				</button>
			{:else if target.status === 'paused'}
				<button
					type="button"
					onclick={() => onResume(target)}
					class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
					title="Resume Goal"
				>
					<Play class="w-4 h-4" />
				</button>
			{/if}

			{#if target.status !== 'cancelled'}
				<button
					type="button"
					onclick={() => onCancel(target)}
					class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
					title="Cancel Goal"
				>
					<Ban class="w-4 h-4" />
				</button>
			{/if}

			<button
				type="button"
				onclick={() => onDelete(target)}
				class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
				title="Delete Goal"
			>
				<Trash2 class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>
