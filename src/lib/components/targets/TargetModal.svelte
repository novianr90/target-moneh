<script lang="ts">
	import type { SavingTarget, TargetPriority, TargetStatus } from '$lib/types/target';
	import type { SavingCategory } from '$lib/types/category';
	import CategoryIcon from '$lib/components/categories/CategoryIcon.svelte';
	import { X, Loader2, Target, Calendar, DollarSign, Tag, Flag } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		targetToEdit?: SavingTarget | null;
		categories?: SavingCategory[];
		onClose: () => void;
		onSave: (data: {
			title: string;
			target_amount: number;
			start_date: string;
			target_date: string;
			category_id?: string | null;
			priority?: TargetPriority;
			status?: TargetStatus;
			notes?: string | null;
		}) => Promise<void>;
	}

	let { isOpen, targetToEdit = null, categories = [], onClose, onSave }: Props = $props();

	let title = $state('');
	let targetAmountStr = $state('');
	let startDate = $state(new Date().toISOString().split('T')[0]);
	let targetDate = $state('');
	let categoryId = $state<string>('');
	let priority = $state<TargetPriority>('medium');
	let status = $state<TargetStatus>('active');
	let notes = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (isOpen) {
			if (targetToEdit) {
				title = targetToEdit.title;
				targetAmountStr = targetToEdit.target_amount.toString();
				startDate = targetToEdit.start_date || new Date().toISOString().split('T')[0];
				targetDate = targetToEdit.target_date || '';
				categoryId = targetToEdit.category_id || '';
				priority = targetToEdit.priority || 'medium';
				status = targetToEdit.status || 'active';
				notes = targetToEdit.notes || '';
			} else {
				title = '';
				targetAmountStr = '';
				startDate = new Date().toISOString().split('T')[0];
				// Default target date to 6 months from today
				const d = new Date();
				d.setMonth(d.getMonth() + 6);
				targetDate = d.toISOString().split('T')[0];
				categoryId = '';
				priority = 'medium';
				status = 'active';
				notes = '';
			}
			errorMessage = null;
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
		targetAmountStr = rawDigits;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const amount = Number(targetAmountStr);

		if (!title.trim()) {
			errorMessage = 'Goal title is required.';
			return;
		}

		if (!amount || amount <= 0) {
			errorMessage = 'Target amount must be greater than zero.';
			return;
		}

		if (!targetDate) {
			errorMessage = 'Target deadline date is required.';
			return;
		}

		if (new Date(targetDate) < new Date(startDate)) {
			errorMessage = 'Target deadline must be on or after start date.';
			return;
		}

		try {
			isSubmitting = true;
			errorMessage = null;
			await onSave({
				title: title.trim(),
				target_amount: amount,
				start_date: startDate,
				target_date: targetDate,
				category_id: categoryId || null,
				priority,
				status,
				notes: notes.trim() || null
			});
			onClose();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to save savings goal.';
		} finally {
			isSubmitting = false;
		}
	}
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
		<div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-800 pb-4">
				<div>
					<h3 class="text-lg font-bold text-white">
						{targetToEdit ? 'Edit Savings Goal' : 'New Savings Goal'}
					</h3>
					<p class="text-slate-400 text-xs mt-0.5">
						Set target amount, deadline, and category allocation
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
				<!-- Title Field -->
				<div class="space-y-1.5">
					<label for="target-title" class="block text-xs font-semibold text-slate-300"> Goal Title </label>
					<input
						id="target-title"
						type="text"
						bind:value={title}
						placeholder="e.g. Dana Darurat 6 Bulan, DP Rumah, Liburan Japan"
						required
						disabled={isSubmitting}
						class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
					/>
				</div>

				<!-- Target Amount (IDR) -->
				<div class="space-y-1.5">
					<label for="target-amount" class="block text-xs font-semibold text-slate-300">
						Target Goal Amount (IDR)
					</label>
					<div class="relative">
						<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
						<input
							id="target-amount"
							type="text"
							value={formatIDR(targetAmountStr)}
							oninput={handleAmountInput}
							placeholder="50.000.000"
							required
							disabled={isSubmitting}
							class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-bold transition-all"
						/>
					</div>
				</div>

				<!-- Dates Row -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Start Date -->
					<div class="space-y-1.5">
						<label for="start-date" class="block text-xs font-semibold text-slate-300"> Start Date </label>
						<input
							id="start-date"
							type="date"
							bind:value={startDate}
							required
							disabled={isSubmitting}
							class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
						/>
					</div>

					<!-- Target Deadline Date -->
					<div class="space-y-1.5">
						<label for="target-date" class="block text-xs font-semibold text-slate-300"> Target Deadline </label>
						<input
							id="target-date"
							type="date"
							bind:value={targetDate}
							required
							disabled={isSubmitting}
							class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
						/>
					</div>
				</div>

				<!-- Category & Priority Row -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Category Selection -->
					<div class="space-y-1.5">
						<label for="category-id" class="block text-xs font-semibold text-slate-300"> Category (Optional) </label>
						<select
							id="category-id"
							bind:value={categoryId}
							disabled={isSubmitting}
							class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
						>
							<option value="">No Category</option>
							{#each categories as cat}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>

					<!-- Priority Selection -->
					<div class="space-y-1.5">
						<label for="priority" class="block text-xs font-semibold text-slate-300"> Priority Level </label>
						<select
							id="priority"
							bind:value={priority}
							disabled={isSubmitting}
							class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
						>
							<option value="high">🔥 High Priority</option>
							<option value="medium">⚡ Medium Priority</option>
							<option value="low">🌱 Low Priority</option>
						</select>
					</div>
				</div>

				<!-- Status Selection (If Editing) -->
				{#if targetToEdit}
					<div class="space-y-1.5">
						<label for="status" class="block text-xs font-semibold text-slate-300"> Goal Operational Status </label>
						<select
							id="status"
							bind:value={status}
							disabled={isSubmitting}
							class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
						>
							<option value="active">Active (Actively tracked)</option>
							<option value="paused">Paused (Temporarily suspended)</option>
							<option value="cancelled">Cancelled (Abandoned)</option>
						</select>
					</div>
				{/if}

				<!-- Notes -->
				<div class="space-y-1.5">
					<label for="notes" class="block text-xs font-semibold text-slate-300"> Notes (Optional) </label>
					<textarea
						id="notes"
						bind:value={notes}
						rows="2"
						placeholder="Additional context or notes..."
						disabled={isSubmitting}
						class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs resize-none"
					></textarea>
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
						class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 transition-colors disabled:opacity-50 font-bold"
					>
						{#if isSubmitting}
							<Loader2 class="w-3.5 h-3.5 animate-spin" />
							<span>Saving...</span>
						{:else}
							<span>{targetToEdit ? 'Save Changes' : 'Create Savings Goal'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
