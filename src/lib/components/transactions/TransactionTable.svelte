<script lang="ts">
	import type { SavingTransaction } from '$lib/types/transaction';
	import { ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Landmark, Target } from '@lucide/svelte';

	interface Props {
		transactions: SavingTransaction[];
		onDelete: (tx: SavingTransaction) => void;
	}

	let { transactions, onDelete }: Props = $props();

	function formatIDR(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse min-w-[760px]">
			<thead>
				<tr class="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
					<th class="py-3.5 px-4">Date</th>
					<th class="py-3.5 px-4">Goal Target</th>
					<th class="py-3.5 px-4">Type</th>
					<th class="py-3.5 px-4">Amount</th>
					<th class="py-3.5 px-4">Source Account</th>
					<th class="py-3.5 px-4">Notes</th>
					<th class="py-3.5 px-4 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-800/60 text-xs">
				{#each transactions as tx (tx.id)}
					{@const isDeposit = tx.transaction_type === 'deposit'}
					{@const target = tx.saving_targets}
					{@const account = tx.saving_accounts}

					<tr class="hover:bg-slate-800/40 transition-colors">
						<!-- Date -->
						<td class="py-4 px-4 whitespace-nowrap text-slate-300">
							<div class="flex items-center gap-1.5 text-xs font-medium">
								<Calendar class="w-3.5 h-3.5 text-slate-500" />
								<span>{new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
							</div>
						</td>

						<!-- Target Goal -->
						<td class="py-4 px-4">
							{#if target}
								<div class="font-bold text-white text-sm">{target.title}</div>
							{:else}
								<span class="text-slate-500 italic">Deleted Target</span>
							{/if}
						</td>

						<!-- Type Badge -->
						<td class="py-4 px-4 whitespace-nowrap">
							<span
								class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border {isDeposit
									? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
									: 'text-rose-400 bg-rose-500/10 border-rose-500/20'}"
							>
								{#if isDeposit}
									<ArrowUpRight class="w-3.5 h-3.5" />
									<span>Deposit</span>
								{:else}
									<ArrowDownLeft class="w-3.5 h-3.5" />
									<span>Withdrawal</span>
								{/if}
							</span>
						</td>

						<!-- Amount -->
						<td class="py-4 px-4 font-extrabold text-sm whitespace-nowrap {isDeposit ? 'text-emerald-400' : 'text-rose-400'}">
							{isDeposit ? '+' : '-'}{formatIDR(tx.amount)}
						</td>

						<!-- Source Account -->
						<td class="py-4 px-4 whitespace-nowrap">
							{#if account}
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-200">
									<Landmark class="w-3.5 h-3.5 text-slate-400" />
									<span>{account.name}</span>
								</span>
							{:else}
								<span class="text-[11px] text-slate-500 italic">External / Cash</span>
							{/if}
						</td>

						<!-- Notes -->
						<td class="py-4 px-4 text-slate-400 max-w-xs truncate">
							{tx.notes || '-'}
						</td>

						<!-- Actions -->
						<td class="py-4 px-4 text-right whitespace-nowrap">
							<button
								type="button"
								onclick={() => onDelete(tx)}
								aria-label={`Delete transaction ${tx.id}`}
								title="Delete transaction entry"
								class="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
