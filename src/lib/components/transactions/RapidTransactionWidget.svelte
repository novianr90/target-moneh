<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import type { SavingAccount } from '$lib/types/account';
	import type { TransactionType } from '$lib/types/transaction';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { ArrowUpRight, ArrowDownLeft, Plus, Loader2, Zap, DollarSign } from '@lucide/svelte';

	interface Props {
		targets: SavingTarget[];
		accounts: SavingAccount[];
		onSubmit: (data: {
			target_id: string;
			amount: number;
			transaction_type: TransactionType;
			transaction_date?: string;
			source_account_id?: string | null;
			notes?: string | null;
		}) => Promise<void>;
	}

	let { targets, accounts, onSubmit }: Props = $props();

	let targetId = $state('');
	let transactionType = $state<TransactionType>('deposit');
	let amountStr = $state('');
	let sourceAccountId = $state('');
	let transactionDate = $state(new Date().toISOString().split('T')[0]);
	let notes = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	// Select first target by default if available
	$effect(() => {
		if (targets.length > 0 && !targetId) {
			targetId = targets[0].id;
		}
	});

	function formatIDR(value: string): string {
		const raw = value.replace(/\D/g, '');
		if (!raw) return '';
		return new Intl.NumberFormat('id-ID').format(Number(raw));
	}

	function handleAmountInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const rawDigits = target.value.replace(/\D/g, '');
		amountStr = rawDigits;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const amount = Number(amountStr);

		if (!targetId) {
			errorMessage = 'Please select a savings goal target.';
			return;
		}

		if (!amount || amount <= 0) {
			errorMessage = 'Amount must be greater than zero.';
			return;
		}

		try {
			isSubmitting = true;
			errorMessage = null;
			await onSubmit({
				target_id: targetId,
				amount,
				transaction_type: transactionType,
				transaction_date: transactionDate,
				source_account_id: sourceAccountId || null,
				notes: notes.trim() || null
			});

			// Reset amount & notes for fast next entry
			amountStr = '';
			notes = '';
		} catch (err: any) {
			errorMessage = err.message || 'Failed to record transaction.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<Zap class="w-4 h-4 text-emerald-400" />
			<h3 class="font-bold text-white text-sm">Rapid Savings Entry</h3>
		</div>
		<span class="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
			&lt; 10s Entry
		</span>
	</div>

	{#if errorMessage}
		<div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
			{errorMessage}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Type Toggle: Deposit vs Withdrawal -->
		<div class="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
			<button
				type="button"
				onclick={() => (transactionType = 'deposit')}
				class="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer {transactionType === 'deposit'
					? 'bg-emerald-500 text-slate-950 shadow-md'
					: 'text-slate-400 hover:text-slate-200'}"
			>
				<ArrowUpRight class="w-4 h-4" />
				<span>+ Deposit / Nabung</span>
			</button>
			<button
				type="button"
				onclick={() => (transactionType = 'withdrawal')}
				class="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer {transactionType === 'withdrawal'
					? 'bg-rose-500 text-white shadow-md'
					: 'text-slate-400 hover:text-slate-200'}"
			>
				<ArrowDownLeft class="w-4 h-4" />
				<span>- Withdrawal / Tarik</span>
			</button>
		</div>

		<!-- Target & Amount Row -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<!-- Target Goal Selector -->
			<div class="space-y-1">
				<label for="rapid-target" class="block text-xs font-semibold text-slate-300">Savings Goal Target</label>
				<select
					id="rapid-target"
					bind:value={targetId}
					required
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					{#if targets.length === 0}
						<option value="">No active goals found</option>
					{:else}
						{#each targets as t}
							<option value={t.id}>{t.title} (Target: Rp {new Intl.NumberFormat('id-ID').format(t.target_amount)})</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- Amount Input (IDR) -->
			<div class="space-y-1">
				<label for="rapid-amount" class="block text-xs font-semibold text-slate-300">Transaction Amount (IDR)</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
					<input
						id="rapid-amount"
						type="text"
						value={formatIDR(amountStr)}
						oninput={handleAmountInput}
						placeholder="e.g. 500.000"
						required
						disabled={isSubmitting}
						class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-bold transition-all"
					/>
				</div>
			</div>
		</div>

		<!-- Source Account & Date Row -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<!-- Source Account (Optional) -->
			<div class="space-y-1">
				<label for="rapid-account" class="block text-xs font-semibold text-slate-300">Source Account (Optional)</label>
				<select
					id="rapid-account"
					bind:value={sourceAccountId}
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					<option value="">None / External</option>
					{#each accounts as acc}
						<option value={acc.id}>{acc.name} ({acc.type})</option>
					{/each}
				</select>
			</div>

			<!-- DatePicker -->
			<DatePicker
				label="Transaction Date"
				value={transactionDate}
				disabled={isSubmitting}
				onChange={(newDate) => (transactionDate = newDate)}
			/>
		</div>

		<!-- Submit Button -->
		<div class="flex items-center justify-between pt-1">
			<input
				type="text"
				bind:value={notes}
				placeholder="Notes (e.g. Bonus gajian, hasil jualan)..."
				disabled={isSubmitting}
				class="flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
			/>

			<button
				type="submit"
				disabled={isSubmitting || targets.length === 0}
				aria-label="Record Savings Transaction"
				title="Record Savings Transaction"
				class="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50 {transactionType === 'deposit'
					? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
					: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'}"
			>
				{#if isSubmitting}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Recording...</span>
				{:else}
					<Plus class="w-4 h-4" />
					<span>{transactionType === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}</span>
				{/if}
			</button>
		</div>
	</form>
</div>
