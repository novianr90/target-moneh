<script lang="ts">
	import type { SavingTransaction } from '$lib/types/transaction';
	import { ArrowUpRight, ArrowDownLeft, ChevronRight, Zap, Calendar } from '@lucide/svelte';

	interface Props {
		transactions: SavingTransaction[];
	}

	let { transactions }: Props = $props();

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<Zap class="w-4 h-4 text-emerald-400" />
			<h3 class="font-bold text-white text-base">Recent Savings Activity</h3>
		</div>
		<a
			href="/transactions"
			class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
		>
			<span>View All</span>
			<ChevronRight class="w-3.5 h-3.5" />
		</a>
	</div>

	{#if transactions.length === 0}
		<div class="p-8 text-center text-slate-500 text-xs">
			Belum ada riwayat aktivitas tabungan. Gunakan form di atas untuk menambah setoran pertama kamu!
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each transactions.slice(0, 5) as tx (tx.id)}
				{@const isDeposit = tx.transaction_type === 'deposit'}
				{@const target = tx.saving_targets}
				{@const account = tx.saving_accounts}

				<div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
					<!-- Left: Type Icon & Details -->
					<div class="flex items-center gap-3">
						<div
							class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs {isDeposit
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
								: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}"
						>
							{#if isDeposit}
								<ArrowUpRight class="w-4 h-4" />
							{:else}
								<ArrowDownLeft class="w-4 h-4" />
							{/if}
						</div>
						<div>
							<div class="font-bold text-white text-xs">{target?.title || 'Savings Goal'}</div>
							<div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
								<span>{new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
								{#if account}
									<span>• {account.name}</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Right: Amount -->
					<div class="text-right">
						<span class="font-extrabold text-xs block {isDeposit ? 'text-emerald-400' : 'text-rose-400'}">
							{isDeposit ? '+' : '-'}{formatIDR(tx.amount)}
						</span>
						{#if tx.notes}
							<span class="text-[10px] text-slate-500 block truncate max-w-[120px]">{tx.notes}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
