<script lang="ts">
	import { Zap, Plus } from '@lucide/svelte';

	interface Props {
		onClick: () => void;
	}

	let { onClick }: Props = $props();
</script>

<div class="fixed bottom-6 right-6 z-40">
	<button
		type="button"
		onclick={onClick}
		aria-label="Quick Savings Deposit FAB"
		title="Quick Savings Deposit (< 10s)"
		class="group relative flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-400/60 hover:scale-105 active:scale-95 transition-all duration-200"
	>
		<!-- Pulse animation ring -->
		<span
			class="absolute -inset-0.5 rounded-full bg-emerald-400 opacity-40 group-hover:opacity-70 animate-ping pointer-events-none"
		></span>

		<Zap class="w-5 h-5 fill-slate-950 stroke-slate-950 relative z-10" />
		<span class="relative z-10 uppercase tracking-wider font-extrabold">+ Quick Deposit</span>
	</button>
</div>
