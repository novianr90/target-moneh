<script lang="ts">
	import { Target } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard - TargetMoneh</title>
</svelte:head>

<div class="space-y-6">
	<!-- Welcome Card -->
	<main class="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
		<div class="flex items-center gap-3">
			<div class="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
				<Target class="w-6 h-6" />
			</div>
			<div>
				<h2 class="text-xl font-bold text-white">Welcome back, {data.user?.email}</h2>
				<p class="text-slate-400 text-xs">TargetMoneh Goal & Savings Tracker</p>
			</div>
		</div>
		<p class="text-slate-400 text-sm leading-relaxed">
			Session state is managed by <code class="text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">@supabase/ssr</code> via HTTP-only cookies and synchronized with <code class="text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">authService</code>.
		</p>
	</main>
</div>
