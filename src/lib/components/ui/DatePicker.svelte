<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import 'flatpickr/dist/themes/dark.css';
	import { Calendar as CalendarIcon } from '@lucide/svelte';

	interface Props {
		value: string; // YYYY-MM-DD
		label?: string;
		minDate?: string;
		maxDate?: string;
		disabled?: boolean;
		placeholder?: string;
		showPresets?: boolean;
		onChange: (newDate: string) => void;
	}

	let {
		value,
		label = '',
		minDate = '',
		maxDate = '',
		disabled = false,
		placeholder = 'Pilih tanggal...',
		showPresets = false,
		onChange
	}: Props = $props();

	let inputEl: HTMLInputElement;
	let fpInstance: flatpickr.Instance | null = null;

	onMount(() => {
		fpInstance = flatpickr(inputEl, {
			defaultDate: value || undefined,
			minDate: minDate || undefined,
			maxDate: maxDate || undefined,
			dateFormat: 'Y-m-d',
			altInput: true,
			altFormat: 'd M Y',
			allowInput: false,
			theme: 'dark',
			onChange: (_selectedDates, dateStr) => {
				onChange(dateStr);
			}
		});
	});

	$effect(() => {
		if (fpInstance) {
			if (minDate !== undefined) fpInstance.set('minDate', minDate || undefined);
			if (maxDate !== undefined) fpInstance.set('maxDate', maxDate || undefined);
			if (value && value !== fpInstance.input.value) {
				fpInstance.setDate(value, false);
			}
		}
	});

	onDestroy(() => {
		fpInstance?.destroy();
	});

	function applyPresetMonths(monthsCount: number) {
		const base = value ? new Date(value + 'T00:00:00') : new Date();
		const result = new Date(base.getFullYear(), base.getMonth() + monthsCount, base.getDate());
		const targetStr = result.toISOString().split('T')[0];
		onChange(targetStr);
		if (fpInstance) {
			fpInstance.setDate(targetStr, true);
		}
	}
</script>

<div class="space-y-1.5 w-full">
	{#if label}
		<span class="block text-xs font-semibold text-slate-300">{label}</span>
	{/if}

	<div class="relative">
		<input
			bind:this={inputEl}
			type="text"
			{disabled}
			{placeholder}
			class="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
		/>
		<CalendarIcon class="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
	</div>

	{#if showPresets}
		<div class="flex items-center gap-1.5 pt-1">
			<span class="text-[10px] font-semibold text-slate-500 mr-1">Quick:</span>
			<button
				type="button"
				onclick={() => applyPresetMonths(1)}
				class="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-emerald-400 border border-slate-800 transition-colors"
			>
				+1Bbln
			</button>
			<button
				type="button"
				onclick={() => applyPresetMonths(3)}
				class="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-emerald-400 border border-slate-800 transition-colors"
			>
				+3Bln
			</button>
			<button
				type="button"
				onclick={() => applyPresetMonths(6)}
				class="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-emerald-400 border border-slate-800 transition-colors"
			>
				+6Bln
			</button>
			<button
				type="button"
				onclick={() => applyPresetMonths(12)}
				class="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-emerald-400 border border-slate-800 transition-colors"
			>
				+1Thn
			</button>
		</div>
	{/if}
</div>

<style>
	:global(.flatpickr-calendar.dark) {
		background: #0f172a !important; /* bg-slate-900 */
		border: 1px solid #1e293b !important; /* border-slate-800 */
		border-radius: 1rem !important;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
		font-family: inherit !important;
		padding: 8px !important;
	}
	:global(.flatpickr-day.selected),
	:global(.flatpickr-day.startRange),
	:global(.flatpickr-day.endRange) {
		background: #10b981 !important; /* emerald-500 */
		border-color: #10b981 !important;
		color: #020617 !important; /* slate-950 */
		font-weight: 800 !important;
		border-radius: 0.75rem !important;
	}
	:global(.flatpickr-day:hover) {
		background: #1e293b !important;
		border-radius: 0.75rem !important;
	}
	:global(.flatpickr-months .flatpickr-month) {
		background: transparent !important;
		color: #f8fafc !important;
	}
	:global(.flatpickr-current-month .flatpickr-monthDropdown-months) {
		background: #0f172a !important;
	}
</style>
