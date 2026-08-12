<script lang="ts">
	import type { SavingTarget, TargetPriority, TargetStatus } from '$lib/types/target';
	import type { SavingCategory } from '$lib/types/category';
	import { PRIORITY_LABELS, STATUS_LABELS } from '$lib/types/target';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { Edit2, Pause, Play, Ban, Trash2, Plus, Loader2, Calendar, Check, X } from '@lucide/svelte';

	interface Props {
		targets: SavingTarget[];
		categories?: SavingCategory[];
		onUpdate: (id: string, payload: any) => Promise<void>;
		onPause: (target: SavingTarget) => void;
		onResume: (target: SavingTarget) => void;
		onCancel: (target: SavingTarget) => void;
		onDelete: (target: SavingTarget) => void;
		onQuickDeposit?: (target: SavingTarget, amount: number) => Promise<void>;
	}

	let {
		targets,
		categories = [],
		onUpdate,
		onPause,
		onResume,
		onCancel,
		onDelete,
		onQuickDeposit
	}: Props = $props();

	// Quick deposit amount state per target id
	let quickAmounts = $state<Record<string, string>>({});
	let submittingDepositId = $state<string | null>(null);

	// Inline Edit Row State
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editAmountStr = $state('');
	let editStartDate = $state('');
	let editTargetDate = $state('');
	let editCategoryId = $state('');
	let editPriority = $state<TargetPriority>('medium');
	let editStatus = $state<TargetStatus>('active');
	let editNotes = $state('');
	let isSavingRow = $state(false);

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

	function handleAmountChange(targetId: string, value: string) {
		const rawDigits = value.replace(/\D/g, '');
		quickAmounts[targetId] = rawDigits;
	}

	async function handleDepositSubmit(e: SubmitEvent, target: SavingTarget) {
		e.preventDefault();
		const rawStr = quickAmounts[target.id] || '';
		const amount = Number(rawStr);
		if (!amount || amount <= 0 || !onQuickDeposit) return;

		try {
			submittingDepositId = target.id;
			await onQuickDeposit(target, amount);
			quickAmounts[target.id] = '';
		} catch (err) {
			console.error('Quick deposit error:', err);
		} finally {
			submittingDepositId = null;
		}
	}

	// Start Inline Row Edit
	function startInlineEdit(target: SavingTarget) {
		editingId = target.id;
		editTitle = target.title;
		editAmountStr = target.target_amount.toString();
		editStartDate = target.start_date || new Date().toISOString().split('T')[0];
		editTargetDate = target.target_date || '';
		editCategoryId = target.category_id || '';
		editPriority = target.priority || 'medium';
		editStatus = target.status || 'active';
		editNotes = target.notes || '';
	}

	// Cancel Inline Row Edit
	function cancelInlineEdit() {
		editingId = null;
	}

	// Save Inline Row Edit
	async function saveInlineEdit(targetId: string) {
		const amount = Number(editAmountStr);
		if (!editTitle.trim() || amount <= 0 || !editTargetDate) return;

		try {
			isSavingRow = true;
			await onUpdate(targetId, {
				title: editTitle.trim(),
				target_amount: amount,
				start_date: editStartDate,
				target_date: editTargetDate,
				category_id: editCategoryId || null,
				priority: editPriority,
				status: editStatus,
				notes: editNotes.trim() || null
			});
			editingId = null;
		} catch (err) {
			console.error('Save inline error:', err);
		} finally {
			isSavingRow = false;
		}
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse min-w-[900px]">
			<thead>
				<tr class="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
					<th class="py-3.5 px-4">Goal Title & Category</th>
					<th class="py-3.5 px-4">Target Amount</th>
					<th class="py-3.5 px-4">Deadline</th>
					<th class="py-3.5 px-4">Quick Deposit</th>
					<th class="py-3.5 px-4">Status</th>
					<th class="py-3.5 px-4 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-800/60 text-xs">
				{#each targets as target (target.id)}
					{@const isEditing = editingId === target.id}
					{@const priorityInfo = PRIORITY_LABELS[target.priority] || PRIORITY_LABELS.medium}
					{@const statusInfo = STATUS_LABELS[target.status] || STATUS_LABELS.active}
					{@const category = target.saving_categories}
					{@const isSubmittingThisDeposit = submittingDepositId === target.id}
					{@const amountValue = quickAmounts[target.id] || ''}

					{#if isEditing}
						<!-- INLINE EDITING ROW (NO MODAL NEEDED!) -->
						<tr class="bg-slate-950/90 border-2 border-emerald-500/50">
							<!-- Goal Title & Category Input -->
							<td class="py-3 px-4 space-y-2">
								<input
									type="text"
									bind:value={editTitle}
									placeholder="Goal Title..."
									class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
								/>
								<div class="flex items-center gap-2">
									<select
										bind:value={editCategoryId}
										class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-emerald-500"
									>
										<option value="">No Category</option>
										{#each categories as cat}
											<option value={cat.id}>{cat.name}</option>
										{/each}
									</select>
									<select
										bind:value={editPriority}
										class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-emerald-500"
									>
										<option value="high">🔥 High</option>
										<option value="medium">⚡ Medium</option>
										<option value="low">🌱 Low</option>
									</select>
								</div>
							</td>

							<!-- Target Amount Input -->
							<td class="py-3 px-4">
								<div class="relative min-w-[130px]">
									<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
									<input
										type="text"
										value={formatIDRInput(editAmountStr)}
										oninput={(e) => (editAmountStr = (e.target as HTMLInputElement).value.replace(/\D/g, ''))}
										placeholder="Amount..."
										class="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</td>

							<!-- Deadline Date Picker -->
							<td class="py-3 px-4 min-w-[160px]">
								<DatePicker
									value={editTargetDate}
									minDate={editStartDate}
									onChange={(newDate) => (editTargetDate = newDate)}
								/>
							</td>

							<!-- Quick Deposit disabled during inline edit -->
							<td class="py-3 px-4 text-slate-500 italic">
								Editing row...
							</td>

							<!-- Status Selection -->
							<td class="py-3 px-4">
								<select
									bind:value={editStatus}
									class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-emerald-500 font-semibold"
								>
									<option value="active">Active</option>
									<option value="paused">Paused</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</td>

							<!-- Save & Cancel Buttons directly in row -->
							<td class="py-3 px-4 text-right whitespace-nowrap">
								<div class="flex items-center justify-end gap-1.5">
									<button
										type="button"
										onclick={() => saveInlineEdit(target.id)}
										disabled={isSavingRow}
										aria-label="Save changes"
										title="Save changes"
										class="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
									>
										{#if isSavingRow}
											<Loader2 class="w-3.5 h-3.5 animate-spin" />
										{:else}
											<Check class="w-3.5 h-3.5" />
											<span>Save</span>
										{/if}
									</button>
									<button
										type="button"
										onclick={cancelInlineEdit}
										disabled={isSavingRow}
										aria-label="Cancel editing"
										title="Cancel editing"
										class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
									>
										<X class="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<!-- NORMAL DISPLAY ROW -->
						<tr class="hover:bg-slate-800/40 transition-colors">
							<!-- Goal Title & Category -->
							<td class="py-4 px-4">
								<div class="space-y-1">
									<div class="font-bold text-white text-sm">{target.title}</div>
									<div class="flex items-center gap-2 flex-wrap">
										{#if category}
											<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-200">
												<span class="w-2 h-2 rounded-full" style="background-color: {category.color || '#10B981'};"></span>
												<span>{category.name}</span>
											</span>
										{:else}
											<span class="text-[10px] text-slate-500 italic">No Category</span>
										{/if}

										<span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border {priorityInfo.colorClass}">
											{priorityInfo.label}
										</span>
									</div>
								</div>
							</td>

							<!-- Target Amount -->
							<td class="py-4 px-4 font-bold text-emerald-400 text-sm whitespace-nowrap">
								{formatIDR(target.target_amount)}
							</td>

							<!-- Deadline -->
							<td class="py-4 px-4 text-slate-300 whitespace-nowrap">
								<div class="flex items-center gap-1.5 text-xs">
									<Calendar class="w-3.5 h-3.5 text-slate-500" />
									<span>{new Date(target.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
								</div>
								<div class="text-[10px] text-slate-500 mt-0.5">
									Start: {new Date(target.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
								</div>
							</td>

							<!-- Direct Inline Quick Deposit Input -->
							<td class="py-4 px-4 min-w-[200px]">
								{#if target.status === 'active' && onQuickDeposit}
									<form onsubmit={(e) => handleDepositSubmit(e, target)} class="flex items-center gap-1.5">
										<div class="relative flex-1">
											<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400">Rp</span>
											<input
												type="text"
												value={formatIDRInput(amountValue)}
												oninput={(e) => handleAmountChange(target.id, (e.target as HTMLInputElement).value)}
												disabled={isSubmittingThisDeposit}
												placeholder="Simpanan..."
												class="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs font-bold focus:outline-none focus:border-emerald-500"
											/>
										</div>
										<button
											type="submit"
											disabled={isSubmittingThisDeposit || !amountValue}
											aria-label={`Deposit money into ${target.title}`}
											title="Deposit money"
											class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-40"
										>
											{#if isSubmittingThisDeposit}
												<Loader2 class="w-3 h-3 animate-spin" />
											{:else}
												<Plus class="w-3 h-3" />
												<span>Nabung</span>
											{/if}
										</button>
									</form>
								{:else}
									<span class="text-[11px] text-slate-500 italic">-</span>
								{/if}
							</td>

							<!-- Status -->
							<td class="py-4 px-4 whitespace-nowrap">
								<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold border {statusInfo.colorClass}">
									{statusInfo.label}
								</span>
							</td>

							<!-- Action Icons (Edit, Pause, Cancel, Delete) -->
							<td class="py-4 px-4 text-right whitespace-nowrap">
								<div class="flex items-center justify-end gap-1">
									<!-- Pencil Icon (Update / Edit Inline) -->
									<button
										type="button"
										onclick={() => startInlineEdit(target)}
										aria-label={`Edit ${target.title}`}
										title="Edit / Update Goal Inline"
										class="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
									>
										<Edit2 class="w-4 h-4" />
									</button>

									<!-- Pause / Resume Icon -->
									{#if target.status === 'active'}
										<button
											type="button"
											onclick={() => onPause(target)}
											aria-label={`Pause ${target.title}`}
											title="Pause Goal"
											class="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
										>
											<Pause class="w-4 h-4" />
										</button>
									{:else if target.status === 'paused'}
										<button
											type="button"
											onclick={() => onResume(target)}
											aria-label={`Resume ${target.title}`}
											title="Resume Goal"
											class="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
										>
											<Play class="w-4 h-4" />
										</button>
									{/if}

									<!-- Cancel Icon -->
									{#if target.status !== 'cancelled'}
										<button
											type="button"
											onclick={() => onCancel(target)}
											aria-label={`Cancel ${target.title}`}
											title="Cancel Goal"
											class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
										>
											<Ban class="w-4 h-4" />
										</button>
									{/if}

									<!-- Delete Icon -->
									<button
										type="button"
										onclick={() => onDelete(target)}
										aria-label={`Delete ${target.title}`}
										title="Delete Goal"
										class="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>
