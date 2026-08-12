<script lang="ts">
	import type { SavingCategory } from '$lib/types/category';
	import type { TargetPriority } from '$lib/types/target';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { Plus, Loader2, Target, Calendar, Sparkles } from '@lucide/svelte';

	interface Props {
		categories?: SavingCategory[];
		onSave: (data: {
			title: string;
			target_amount: number;
			start_date: string;
			target_date: string;
			category_id?: string | null;
			priority?: TargetPriority;
			notes?: string | null;
		}) => Promise<void>;
	}

	let { categories = [], onSave }: Props = $props();

	let title = $state('');
	let targetAmountStr = $state('');
	let startDate = $state(new Date().toISOString().split('T')[0]);
	let targetDate = $state('');
	let categoryId = $state('');
	let priority = $state<TargetPriority>('medium');
	let notes = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	// Set default deadline date (6 months from today)
	$effect(() => {
		if (!targetDate) {
			const d = new Date();
			d.setMonth(d.getMonth() + 6);
			targetDate = d.toISOString().split('T')[0];
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
				notes: notes.trim() || null
			});

			// Reset form
			title = '';
			targetAmountStr = '';
			notes = '';
		} catch (err: any) {
			errorMessage = err.message || 'Failed to create goal.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<Sparkles class="w-4 h-4 text-emerald-400" />
			<h3 class="font-bold text-white text-sm">Create New Savings Goal</h3>
		</div>
		<span class="text-[11px] text-slate-500 font-medium">Quick Goal Insert</span>
	</div>

	{#if errorMessage}
		<div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
			{errorMessage}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Inputs Row 1: Title & Target Amount -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="space-y-1">
				<label for="insert-title" class="block text-xs font-semibold text-slate-300">Goal Title</label>
				<input
					id="insert-title"
					type="text"
					bind:value={title}
					placeholder="e.g. Dana Darurat, DP Rumah, Liburan Japan"
					required
					disabled={isSubmitting}
					class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
				/>
			</div>

			<div class="space-y-1">
				<label for="insert-amount" class="block text-xs font-semibold text-slate-300">Target Amount (IDR)</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">Rp</span>
					<input
						id="insert-amount"
						type="text"
						value={formatIDR(targetAmountStr)}
						oninput={handleAmountInput}
						placeholder="50.000.000"
						required
						disabled={isSubmitting}
						class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-bold"
					/>
				</div>
			</div>
		</div>

		<!-- Inputs Row 2: Dates -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<DatePicker
				label="Start Date"
				value={startDate}
				disabled={isSubmitting}
				onChange={(newDate) => (startDate = newDate)}
			/>

			<DatePicker
				label="Target Deadline Date"
				value={targetDate}
				minDate={startDate}
				showPresets={true}
				disabled={isSubmitting}
				onChange={(newDate) => (targetDate = newDate)}
			/>
		</div>

		<!-- Inputs Row 3: Category & Priority -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="space-y-1">
				<label for="insert-category" class="block text-xs font-semibold text-slate-300">Category (Optional)</label>
				<select
					id="insert-category"
					bind:value={categoryId}
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					<option value="">No Category</option>
					{#each categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-1">
				<label for="insert-priority" class="block text-xs font-semibold text-slate-300">Priority Level</label>
				<select
					id="insert-priority"
					bind:value={priority}
					disabled={isSubmitting}
					class="w-full px-4 pr-12 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
				>
					<option value="high">🔥 High Priority</option>
					<option value="medium">⚡ Medium Priority</option>
					<option value="low">🌱 Low Priority</option>
				</select>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end pt-1">
			<button
				type="submit"
				disabled={isSubmitting}
				aria-label="Add Savings Goal"
				title="Add Savings Goal"
				class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-50"
			>
				{#if isSubmitting}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Saving Goal...</span>
				{:else}
					<Plus class="w-4 h-4" />
					<span>+ Add Savings Goal</span>
				{/if}
			</button>
		</div>
	</form>
</div>
