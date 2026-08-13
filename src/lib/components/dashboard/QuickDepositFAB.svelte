<script lang="ts">
	import { Zap } from '@lucide/svelte';

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
		class="flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-xl shadow-emerald-500/30"
	>
		<Zap class="w-5 h-5 fill-slate-950 stroke-slate-950" />
		<span class="uppercase tracking-wider font-extrabold">+ Quick Deposit</span>
	</button>
</div>
