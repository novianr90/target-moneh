<script lang="ts">
	import type { SavingTransaction } from '$lib/types/transaction';
	import type { SavingTarget } from '$lib/types/target';
	import type { TargetBalance } from '$lib/types/transaction';
	import { calculateGoalMetrics } from '$lib/engines';
	import { Calendar, TrendingUp, Info, ArrowUpRight, CheckCircle2 } from '@lucide/svelte';

	interface Props {
		transactions: SavingTransaction[];
		targets: SavingTarget[];
		balances: TargetBalance[];
	}

	let { transactions = [], targets = [], balances = [] }: Props = $props();

	const MONTH_NAMES_SHORT = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'Mei',
		'Jun',
		'Jul',
		'Agu',
		'Sep',
		'Okt',
		'Nov',
		'Des'
	];

	// Compute required monthly total for all active targets
	const totalRequiredMonthly = $derived.by(() => {
		const activeTargets = targets.filter((t) => t.status === 'active');
		return activeTargets.reduce((sum, target) => {
			const b = balances.find((bal) => bal.target_id === target.id);
			const targetTxs = transactions.filter((tx) => tx.target_id === target.id);
			const metrics = calculateGoalMetrics({
				id: target.id,
				title: target.title,
				target_amount: target.target_amount,
				start_date: target.start_date,
				target_date: target.target_date,
				status: target.status,
				current_balance: b?.current_balance || 0,
				transactions: targetTxs
			});

			return sum + (metrics.required_monthly_savings || 0);
		}, 0);
	});

	// Generate last 6 months (including current month)
	const timelineData = $derived.by(() => {
		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth(); // 0-indexed

		const months: Array<{
			year: number;
			monthIndex: number;
			yearMonthKey: string;
			label: string;
			isCurrentMonth: boolean;
			actualNet: number;
			required: number;
			ratioPercent: number;
		}> = [];

		for (let i = 5; i >= 0; i--) {
			const d = new Date(currentYear, currentMonth - i, 1);
			const y = d.getFullYear();
			const m = d.getMonth();
			const key = `${y}-${String(m + 1).padStart(2, '0')}`;
			const label = `${MONTH_NAMES_SHORT[m]} ${y}`;
			const isCurrentMonth = i === 0;

			// Calculate Actual Net Contribution for this month
			let actualNet = 0;
			for (const tx of transactions) {
				const txDate = new Date(tx.transaction_date);
				const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
				if (txKey === key) {
					if (tx.transaction_type === 'deposit') {
						actualNet += tx.amount;
					} else if (tx.transaction_type === 'withdrawal') {
						actualNet -= tx.amount;
					}
				}
			}

			const req = totalRequiredMonthly;
			const ratioPercent = req > 0 ? Math.min(150, Math.round((Math.max(0, actualNet) / req) * 100)) : 100;

			months.push({
				year: y,
				monthIndex: m,
				yearMonthKey: key,
				label,
				isCurrentMonth,
				actualNet,
				required: req,
				ratioPercent
			});
		}

		return months;
	});

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
				<TrendingUp class="w-5 h-5" />
			</div>
			<div>
				<h3 class="font-extrabold text-white text-base md:text-lg flex items-center gap-2">
					<span>Savings Timeline Visualization</span>
				</h3>
				<p class="text-slate-400 text-xs">
					Actual Net Contribution vs Required Monthly Target across recent months
				</p>
			</div>
		</div>

		<div class="flex items-center gap-4 text-xs font-semibold">
			<div class="flex items-center gap-1.5 text-emerald-400">
				<div class="w-3 h-3 rounded-md bg-emerald-500"></div>
				<span>Actual Net</span>
			</div>
			<div class="flex items-center gap-1.5 text-slate-400">
				<div class="w-3 h-3 rounded-md bg-slate-700 border border-slate-600"></div>
				<span>Required Target</span>
			</div>
		</div>
	</div>

	<!-- Notice Banner for Current Month Indicator -->
	<div class="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-start gap-2 text-xs text-slate-400">
		<Info class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
		<span>
			<strong class="text-slate-200">Current-Month Indicator:</strong> The ongoing month shows real-time actual savings so far. Note per §7.3 that current month contributions do not alter historical velocity or health calculations until completed.
		</span>
	</div>

	<!-- Month-by-Month Bar Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
		{#each timelineData as item}
			<div
				class="bg-slate-950/70 border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all relative overflow-hidden {item.isCurrentMonth
					? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
					: 'border-slate-800/80 hover:border-slate-700'}"
			>
				{#if item.isCurrentMonth}
					<div class="absolute top-0 right-0">
						<span
							class="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-bl-xl tracking-wider"
						>
							Current
						</span>
					</div>
				{/if}

				<!-- Top Month Label -->
				<div class="space-y-1">
					<span class="text-xs font-extrabold text-white block">{item.label}</span>
					{#if item.isCurrentMonth}
						<span class="text-[10px] font-semibold text-emerald-400 block">In Progress</span>
					{:else}
						<span class="text-[10px] font-medium text-slate-500 block">Completed</span>
					{/if}
				</div>

				<!-- Visual Progress Bar Comparison -->
				<div class="space-y-2 py-1">
					<div class="space-y-1">
						<div class="flex justify-between text-[11px] font-bold">
							<span class="text-slate-400">Actual</span>
							<span class={item.actualNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
								{formatIDR(item.actualNet)}
							</span>
						</div>
						<div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
							<div
								class="h-full rounded-full transition-all duration-300 {item.actualNet >= item.required && item.required > 0
									? 'bg-emerald-400'
									: item.actualNet > 0
										? 'bg-amber-400'
										: 'bg-rose-500'}"
								style="width: {item.ratioPercent}%;"
							></div>
						</div>
					</div>

					<div class="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
						<span>Target:</span>
						<span class="font-semibold text-slate-300">{formatIDR(item.required)}</span>
					</div>
				</div>

				<!-- Status Summary Badge -->
				<div class="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
					{#if item.actualNet >= item.required && item.required > 0}
						<span class="text-emerald-400 font-extrabold flex items-center gap-1">
							<CheckCircle2 class="w-3 h-3" />
							<span>Met Target</span>
						</span>
					{:else if item.actualNet > 0}
						<span class="text-amber-400 font-bold">
							{Math.round((item.actualNet / (item.required || 1)) * 100)}% Met
						</span>
					{:else if item.actualNet < 0}
						<span class="text-rose-400 font-bold">Net Outflow</span>
					{:else}
						<span class="text-slate-500">No Deposits</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
