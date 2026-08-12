<script lang="ts">
	import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from '@lucide/svelte';

	interface Props {
		value: string; // YYYY-MM-DD
		label?: string;
		minDate?: string; // YYYY-MM-DD
		maxDate?: string; // YYYY-MM-DD
		disabled?: boolean;
		showPresets?: boolean;
		onChange: (newDate: string) => void;
	}

	let {
		value,
		label = '',
		minDate = '',
		maxDate = '',
		disabled = false,
		showPresets = false,
		onChange
	}: Props = $props();

	let isOpen = $state(false);

	// Currently viewed month/year in calendar view
	let viewDate = $state(new Date());

	$effect(() => {
		if (value) {
			const parsed = new Date(value + 'T00:00:00');
			if (!isNaN(parsed.getTime())) {
				viewDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
			}
		}
	});

	const currentYear = $derived(viewDate.getFullYear());
	const currentMonth = $derived(viewDate.getMonth());

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

	function formatDisplayDate(dateStr: string): string {
		if (!dateStr) return 'Select date...';
		const d = new Date(dateStr + 'T00:00:00');
		if (isNaN(d.getTime())) return dateStr;
		return d.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function handlePrevMonth() {
		viewDate = new Date(currentYear, currentMonth - 1, 1);
	}

	function handleNextMonth() {
		viewDate = new Date(currentYear, currentMonth + 1, 1);
	}

	function isDateDisabled(year: number, month: number, day: number): boolean {
		const targetStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		if (minDate && targetStr < minDate) return true;
		if (maxDate && targetStr > maxDate) return true;
		return false;
	}

	function isSelectedDate(year: number, month: number, day: number): boolean {
		if (!value) return false;
		const targetStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		return value === targetStr;
	}

	function isToday(year: number, month: number, day: number): boolean {
		const today = new Date();
		return (
			today.getFullYear() === year &&
			today.getMonth() === month &&
			today.getDate() === day
		);
	}

	function handleSelectDay(year: number, month: number, day: number) {
		const targetStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		onChange(targetStr);
		isOpen = false;
	}

	function applyPresetMonths(monthsCount: number) {
		const base = value ? new Date(value + 'T00:00:00') : new Date();
		const result = new Date(base.getFullYear(), base.getMonth() + monthsCount, base.getDate());
		const targetStr = result.toISOString().split('T')[0];
		onChange(targetStr);
	}

	// Generate calendar grid days
	const calendarDays = $derived.by(() => {
		const days: Array<{ day: number; isCurrentMonth: boolean; monthOffset: number }> = [];

		// First day of month (0 = Sunday, 1 = Monday...)
		const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
		// Convert Sunday = 0 to Monday = 0 index
		const paddingDays = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

		const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
		const currentMonthDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();

		// Previous month padding
		for (let i = paddingDays - 1; i >= 0; i--) {
			days.push({
				day: prevMonthDaysCount - i,
				isCurrentMonth: false,
				monthOffset: -1
			});
		}

		// Current month days
		for (let day = 1; day <= currentMonthDaysCount; day++) {
			days.push({
				day,
				isCurrentMonth: true,
				monthOffset: 0
			});
		}

		// Remaining padding for 6-row (42 cells) or 5-row grid
		const remaining = 42 - days.length;
		for (let day = 1; day <= remaining; day++) {
			days.push({
				day,
				isCurrentMonth: false,
				monthOffset: 1
			});
		}

		return days;
	});
</script>

<div class="relative w-full">
	{#if label}
		<span class="block text-xs font-semibold text-slate-300 mb-1.5">{label}</span>
	{/if}

	<!-- Input Trigger Button -->
	<button
		type="button"
		{disabled}
		onclick={() => (isOpen = !isOpen)}
		class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 hover:border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 flex items-center justify-between text-xs transition-all cursor-pointer disabled:opacity-50"
	>
		<div class="flex items-center gap-2.5 font-medium">
			<CalendarIcon class="w-4 h-4 text-emerald-400" />
			<span class={value ? 'text-slate-100 font-semibold' : 'text-slate-500'}>
				{formatDisplayDate(value)}
			</span>
		</div>
		<span class="text-[10px] text-slate-500 font-mono">📅</span>
	</button>

	<!-- Calendar Popover Widget -->
	{#if isOpen}
		<!-- Click Outside Backdrop -->
		<div
			class="fixed inset-0 z-50 bg-transparent"
			role="button"
			tabindex="-1"
			onclick={() => (isOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		></div>

		<div class="absolute left-0 top-full mt-2 z-50 w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
			<!-- Header Controls -->
			<div class="flex items-center justify-between">
				<button
					type="button"
					onclick={handlePrevMonth}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>

				<span class="text-xs font-bold text-white">
					{monthNames[currentMonth]} {currentYear}
				</span>

				<button
					type="button"
					onclick={handleNextMonth}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>

			<!-- Day Headers -->
			<div class="grid grid-cols-7 text-center border-b border-slate-800 pb-1.5">
				{#each dayHeaders as d}
					<span class="text-[10px] font-bold text-slate-500 uppercase">{d}</span>
				{/each}
			</div>

			<!-- Calendar Grid Days -->
			<div class="grid grid-cols-7 gap-1 text-center">
				{#each calendarDays as item}
					{@const month = currentMonth + item.monthOffset}
					{@const year = currentYear}
					{@const disabled = !item.isCurrentMonth || isDateDisabled(year, month, item.day)}
					{@const selected = item.isCurrentMonth && isSelectedDate(year, month, item.day)}
					{@const today = item.isCurrentMonth && isToday(year, month, item.day)}

					<button
						type="button"
						disabled={disabled}
						onclick={() => item.isCurrentMonth && handleSelectDay(year, month, item.day)}
						class="w-8 h-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer {selected
							? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
							: today
								? 'border border-emerald-500/50 text-emerald-400 font-bold bg-emerald-500/10'
								: item.isCurrentMonth
									? 'text-slate-200 hover:bg-slate-800 hover:text-white'
									: 'text-slate-700 opacity-40 cursor-not-allowed'}"
					>
						{item.day}
					</button>
				{/each}
			</div>

			<!-- Deadline Presets (If enabled) -->
			{#if showPresets}
				<div class="pt-2 border-t border-slate-800 space-y-1.5">
					<span class="text-[10px] font-bold text-slate-500 block uppercase">Quick Deadlines</span>
					<div class="grid grid-cols-4 gap-1">
						<button
							type="button"
							onclick={() => applyPresetMonths(1)}
							class="py-1 px-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-800 transition-colors"
						>
							+1 Mo
						</button>
						<button
							type="button"
							onclick={() => applyPresetMonths(3)}
							class="py-1 px-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-800 transition-colors"
						>
							+3 Mo
						</button>
						<button
							type="button"
							onclick={() => applyPresetMonths(6)}
							class="py-1 px-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-800 transition-colors"
						>
							+6 Mo
						</button>
						<button
							type="button"
							onclick={() => applyPresetMonths(12)}
							class="py-1 px-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-800 transition-colors"
						>
							+1 Yr
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
