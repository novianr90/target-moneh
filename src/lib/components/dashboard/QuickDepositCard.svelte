<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import type { SavingAccount } from '$lib/types/account';
	import { Plus, Loader2, Zap, ArrowUpRight } from '@lucide/svelte';

	interface Props {
		targets: SavingTarget[];
		accounts: SavingAccount[];
		onDeposit: (data: {
			target_id: string;
			amount: number;
			source_account_id?: string | null;
			notes?: string | null;
		}) => Promise<void>;
	}

	let { targets, accounts, onDeposit }: Props = $props();

	let targetId = $state('');
	let amountStr = $state('');
	let sourceAccountId = $state('');
	let notes = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

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
			errorMessage = 'Pilih target tabungan.';
			return;
		}

		if (!amount || amount <= 0) {
			errorMessage = 'Nominal setoran harus lebih dari 0.';
			return;
		}

		try {
			isSubmitting = true;
			errorMessage = null;
			await onDeposit({
				target_id: targetId,
				amount,
				source_account_id: sourceAccountId || null,
				notes: notes.trim() || null
			});

			amountStr = '';
			notes = '';
		} catch (err: any) {
			errorMessage = err.message || 'Gagal mencatat setoran.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
				<Zap class="w-4 h-4" />
			</div>
			<div>
				<h3 class="font-bold text-white text-base">Quick Savings Insert</h3>
				<p class="text-slate-400 text-xs">Setor tabungan langsung dari Dashboard</p>
			</div>
		</div>
		<span class="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
			+ Setor Tabungan
		</span>
	</div>

	{#if errorMessage}
		<div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
			{errorMessage}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<!-- Target Goal Selector -->
			<div class="space-y-1">
				<label for="quick-target" class="block text-xs font-semibold text-slate-300">Target Tabungan Goal</label>
				<select
					id="quick-target"
					bind:value={targetId}
					required
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					{#if targets.length === 0}
						<option value="">Belum ada target goal aktif</option>
					{:else}
						{#each targets as t}
							<option value={t.id}>{t.title}</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- Amount Input (IDR) -->
			<div class="space-y-1">
				<label for="quick-amount" class="block text-xs font-semibold text-slate-300">Nominal Setor (IDR)</label>
				<div class="relative">
					<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
					<input
						id="quick-amount"
						type="text"
						value={formatIDR(amountStr)}
						oninput={handleAmountInput}
						placeholder="500.000"
						required
						disabled={isSubmitting}
						class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-bold transition-all"
					/>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<!-- Source Account (Optional) -->
			<div class="space-y-1">
				<label for="quick-account" class="block text-xs font-semibold text-slate-300">Akun Sumber (Opsional)</label>
				<select
					id="quick-account"
					bind:value={sourceAccountId}
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					<option value="">Tunai / Eksternal</option>
					{#each accounts as acc}
						<option value={acc.id}>{acc.name} ({acc.type})</option>
					{/each}
				</select>
			</div>

			<!-- Notes -->
			<div class="space-y-1">
				<label for="quick-notes" class="block text-xs font-semibold text-slate-300">Catatan (Opsional)</label>
				<input
					id="quick-notes"
					type="text"
					bind:value={notes}
					placeholder="Catatan simpanan..."
					disabled={isSubmitting}
					class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
				/>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end pt-1">
			<button
				type="submit"
				disabled={isSubmitting || targets.length === 0}
				aria-label="Setor Tabungan"
				title="Setor Tabungan"
				class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-50"
			>
				{#if isSubmitting}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Menyimpan...</span>
				{:else}
					<Plus class="w-4 h-4" />
					<span>+ Setor Tabungan</span>
				{/if}
			</button>
		</div>
	</form>
</div>
