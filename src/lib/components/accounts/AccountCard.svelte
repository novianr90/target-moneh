<script lang="ts">
	import type { SavingAccount } from '$lib/types/account';
	import { ACCOUNT_TYPE_LABELS } from '$lib/types/account';
	import { Landmark, Wallet, TrendingUp, Banknote, Edit2, Archive, ArchiveRestore } from '@lucide/svelte';

	interface Props {
		account: SavingAccount;
		onEdit: (account: SavingAccount) => void;
		onArchive: (account: SavingAccount) => void;
		onUnarchive: (account: SavingAccount) => void;
	}

	let { account, onEdit, onArchive, onUnarchive }: Props = $props();

	const isArchived = $derived(account.archived_at !== null);
	const typeInfo = $derived(ACCOUNT_TYPE_LABELS[account.type] || ACCOUNT_TYPE_LABELS.bank);

	const IconComponent = $derived.by(() => {
		switch (account.type) {
			case 'bank':
				return Landmark;
			case 'wallet':
				return Wallet;
			case 'investment':
				return TrendingUp;
			case 'cash':
				return Banknote;
			default:
				return Landmark;
		}
	});
</script>

<div
	class="bg-slate-900 border rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-slate-700 {isArchived
		? 'border-slate-800/60 opacity-60 bg-slate-900/40'
		: 'border-slate-800'}"
>
	<!-- Left Details -->
	<div class="flex items-center gap-3.5">
		<div class="p-3 rounded-xl border {typeInfo.colorClass}">
			<IconComponent class="w-5 h-5" />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<h4 class="font-bold text-white text-sm">{account.name}</h4>
				{#if isArchived}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
						Archived
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 mt-1">
				<span class="text-xs text-slate-400">{typeInfo.label}</span>
				<span class="text-slate-600 text-xs">•</span>
				<span class="text-[11px] text-slate-500">
					Created {new Date(account.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
				</span>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-1.5">
		{#if !isArchived}
			<button
				type="button"
				onclick={() => onEdit(account)}
				class="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
				title="Edit Account"
			>
				<Edit2 class="w-4 h-4" />
			</button>
			<button
				type="button"
				onclick={() => onArchive(account)}
				class="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
				title="Archive Account"
			>
				<Archive class="w-4 h-4" />
			</button>
		{:else}
			<button
				type="button"
				onclick={() => onUnarchive(account)}
				class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center gap-1.5 transition-colors"
				title="Restore Account"
			>
				<ArchiveRestore class="w-3.5 h-3.5" />
				<span>Restore</span>
			</button>
		{/if}
	</div>
</div>
