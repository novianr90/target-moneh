<script lang="ts">
	import type { SavingTarget } from '$lib/types/target';
	import type { SavingAccount } from '$lib/types/account';
	import { Zap, X, Loader2, Check, Sparkles } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		targets: SavingTarget[];
		accounts: SavingAccount[];
		selectedTargetId?: string;
		onClose: () => void;
		onDeposit: (data: {
			target_id: string;
			amount: number;
			source_account_id?: string | null;
			notes?: string | null;
		}) => Promise<void>;
	}

	let {
		isOpen = false,
		targets = [],
		accounts = [],
		selectedTargetId = '',
		onClose,
		onDeposit
	}: Props = $props();

	let targetId = $state('');
	let amountStr = $state('');
	let sourceAccountId = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	let amountInputRef = $state<HTMLInputElement | null>(null);

	// Presets in IDR
	const presets = [
		{ label: '+100rb', value: 100000 },
		{ label: '+250rb', value: 250000 },
		{ label: '+500rb', value: 500000 },
		{ label: '+1jt', value: 1000000 },
		{ label: '+2jt', value: 2000000 },
		{ label: '+5jt', value: 5000000 }
	];

	// Update default target ID when modal opens or selectedTargetId changes
	$effect(() => {
		if (isOpen) {
			if (selectedTargetId && targets.some((t) => t.id === selectedTargetId)) {
				targetId = selectedTargetId;
			} else if (targets.length > 0) {
				targetId = targets[0].id;
			}
			errorMessage = null;

			// Autofocus input field for sub-10 second rapid deposit
			setTimeout(() => {
				if (amountInputRef) {
					amountInputRef.focus();
					amountInputRef.select();
				}
			}, 50);
		}
	});

	function formatIDR(value: string): string {
		const raw = value.replace(/\D/g, '');
		if (!raw) return '';
		return new Intl.NumberFormat('id-ID').format(Number(raw));
	}

	function handleAmountInput(e: Event) {
		const target = e.target as HTMLInputElement;
		amountStr = target.value.replace(/\D/g, '');
	}

	function addPreset(value: number) {
		const current = Number(amountStr) || 0;
		amountStr = String(current + value);
		if (amountInputRef) {
			amountInputRef.focus();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen && !isSubmitting) {
			onClose();
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const amount = Number(amountStr);

		if (!targetId) {
			errorMessage = 'Pilih target tabungan.';
			return;
		}

		if (!amount || amount <= 0) {
			errorMessage = 'Nominal setoran harus lebih besar dari Rp 0.';
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
			onClose();
		} catch (err: any) {
			errorMessage = err.message || 'Gagal menyimpan setoran tabungan.';
		} fontFinally: {
			isSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="quick-deposit-title"
	>
		<div
			class="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl shadow-emerald-950/50 relative overflow-hidden"
		>
			<!-- Glow Accent -->
			<div
				class="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"
			></div>

			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-800 pb-4">
				<div class="flex items-center gap-3">
					<div
						class="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10"
					>
						<Zap class="w-5 h-5 fill-emerald-400" />
					</div>
					<div>
						<h3 id="quick-deposit-title" class="text-lg font-extrabold text-white">
							Quick Savings Deposit
						</h3>
						<p class="text-slate-400 text-xs">Rapid deposit entry in under 10 seconds</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					disabled={isSubmitting}
					aria-label="Close modal"
					class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			{#if errorMessage}
				<div
					class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-5">
				<!-- Target Goal Selection -->
				<div class="space-y-1.5">
					<label for="modal-target" class="block text-xs font-bold text-slate-300">
						Target Savings Goal <span class="text-rose-400">*</span>
					</label>
					<select
						id="modal-target"
						bind:value={targetId}
						required
						disabled={isSubmitting}
						class="w-full px-4 pr-12 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
					>
						{#if targets.length === 0}
							<option value="">No active goals found</option>
						{:else}
							{#each targets as t}
								<option value={t.id}>{t.title}</option>
							{/each}
						{/if}
					</select>
				</div>

				<!-- Amount Input (With Autofocus) -->
				<div class="space-y-2">
					<label for="modal-amount" class="block text-xs font-bold text-slate-300">
						Deposit Amount (IDR) <span class="text-rose-400">*</span>
					</label>
					<div class="relative">
						<span
							class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-400"
							>Rp</span
						>
						<input
							id="modal-amount"
							bind:this={amountInputRef}
							type="text"
							value={formatIDR(amountStr)}
							oninput={handleAmountInput}
							placeholder="500.000"
							required
							disabled={isSubmitting}
							class="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950 border border-emerald-500/40 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 text-lg font-black tracking-wide transition-all shadow-inner"
						/>
					</div>

					<!-- Quick Presets -->
					<div class="flex items-center gap-1.5 flex-wrap pt-1">
						<span class="text-[11px] font-semibold text-slate-500 mr-1">Quick:</span>
						{#each presets as p}
							<button
								type="button"
								onclick={() => addPreset(p.value)}
								disabled={isSubmitting}
								class="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-emerald-400 font-bold text-xs transition-colors"
							>
								{p.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Source Account & Notes -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<label for="modal-account" class="block text-xs font-semibold text-slate-300">
							Source Account (Optional)
						</label>
						<select
							id="modal-account"
							bind:value={sourceAccountId}
							disabled={isSubmitting}
							class="w-full px-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
						>
							<option value="">Cash / External</option>
							{#each accounts as acc}
								<option value={acc.id}>{acc.name} ({acc.type})</option>
							{/each}
						</select>
					</div>

					<div class="space-y-1.5">
						<label for="modal-notes" class="block text-xs font-semibold text-slate-300">
							Notes (Optional)
						</label>
						<input
							id="modal-notes"
							type="text"
							bind:value={notes}
							placeholder="Monthly deposit..."
							disabled={isSubmitting}
							class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
						/>
					</div>
				</div>

				<!-- Modal Actions -->
				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={onClose}
						disabled={isSubmitting}
						class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={isSubmitting || targets.length === 0}
						class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
					>
						{#if isSubmitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							<span>Saving...</span>
						{:else}
							<Check class="w-4 h-4 stroke-[3]" />
							<span>Confirm Deposit</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
