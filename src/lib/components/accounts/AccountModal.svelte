<script lang="ts">
	import type { SavingAccount, AccountType } from '$lib/types/account';
	import { ACCOUNT_TYPE_LABELS } from '$lib/types/account';
	import { X, Landmark, Wallet, TrendingUp, Banknote, Loader2 } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		accountToEdit?: SavingAccount | null;
		onClose: () => void;
		onSave: (data: { name: string; type: AccountType }) => Promise<void>;
	}

	let { isOpen, accountToEdit = null, onClose, onSave }: Props = $props();

	let name = $state('');
	let type = $state<AccountType>('bank');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (isOpen) {
			if (accountToEdit) {
				name = accountToEdit.name;
				type = accountToEdit.type;
			} else {
				name = '';
				type = 'bank';
			}
			errorMessage = null;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) {
			errorMessage = 'Account name is required.';
			return;
		}

		try {
			isSubmitting = true;
			errorMessage = null;
			await onSave({ name: name.trim(), type });
			onClose();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to save account.';
		} finally {
			isSubmitting = false;
		}
	}

	const accountTypes: { type: AccountType; label: string; description: string; icon: typeof Landmark }[] = [
		{ type: 'bank', label: 'Bank Account', description: 'Checking/Savings accounts (e.g. BCA, Mandiri)', icon: Landmark },
		{ type: 'wallet', label: 'E-Wallet', description: 'Digital wallets (e.g. GoPay, OVO, ShopeePay)', icon: Wallet },
		{ type: 'investment', label: 'Investment', description: 'Mutual funds, stocks, gold (e.g. Bibit, Ajaib)', icon: TrendingUp },
		{ type: 'cash', label: 'Cash / Physical', description: 'Physical cash or envelope savings', icon: Banknote }
	];
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		role="button"
		tabindex="0"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<!-- Modal Card -->
		<div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<h3 class="text-lg font-bold text-white">
						{accountToEdit ? 'Edit Source Account' : 'New Source Account'}
					</h3>
					<p class="text-slate-400 text-xs mt-0.5">
						Source account tag for transaction logging
					</p>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if errorMessage}
				<div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
					{errorMessage}
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-5">
				<!-- Name Field -->
				<div class="space-y-1.5">
					<label for="account-name" class="block text-xs font-semibold text-slate-300"> Account Name </label>
					<input
						id="account-name"
						type="text"
						bind:value={name}
						placeholder="e.g. BCA Tabungan Utama, GoPay, Bibit Reksadana"
						required
						disabled={isSubmitting}
						class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
					/>
				</div>

				<!-- Type Selection -->
				<div class="space-y-2">
					<span class="block text-xs font-semibold text-slate-300"> Account Type </span>
					<div class="grid grid-cols-1 gap-2.5">
						{#each accountTypes as item}
							{@const IconComp = item.icon}
							{@const isSelected = type === item.type}
							<button
								type="button"
								onclick={() => (type = item.type)}
								disabled={isSubmitting}
								class="flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer {isSelected
									? 'bg-emerald-500/10 border-emerald-500/50 text-white'
									: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}"
							>
								<div class="p-2 rounded-lg {isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}">
									<IconComp class="w-4 h-4" />
								</div>
								<div>
									<div class="text-xs font-semibold">{item.label}</div>
									<div class="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={onClose}
						disabled={isSubmitting}
						class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 transition-colors disabled:opacity-50"
					>
						{#if isSubmitting}
							<Loader2 class="w-3.5 h-3.5 animate-spin" />
							<span>Saving...</span>
						{:else}
							<span>{accountToEdit ? 'Save Changes' : 'Create Account'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
