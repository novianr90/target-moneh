<script lang="ts">
	import { authService } from '$lib/services/auth';
	import { goto, invalidate } from '$app/navigation';
	import { Target, LogIn, Loader2, Lock } from '@lucide/svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	async function handleLogin() {
		errorMsg = '';
		if (!email || !password) {
			errorMsg = 'Please enter both email and password';
			return;
		}

		loading = true;

		try {
			await authService.signIn(email.trim(), password);
			await invalidate('supabase:auth');
			await goto('/');
		} catch (err: any) {
			errorMsg = err.message || 'AUTH001: Invalid email or password';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - TargetMoneh</title>
</svelte:head>

<div class="min-h-[75vh] flex items-center justify-center py-12 px-4 bg-slate-950 text-slate-100">
	<div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
		<div class="text-center space-y-2">
			<div class="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20">
				<Target class="w-8 h-8" />
			</div>
			<h1 class="text-2xl font-black text-white">Welcome Back</h1>
			<p class="text-xs text-slate-400">Sign in to your private personal savings tracker</p>
		</div>

		{#if errorMsg}
			<div class="p-3 text-xs bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-lg">
				{errorMsg}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<div>
				<label for="auth-email" class="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
				<input
					id="auth-email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 text-sm"
				/>
			</div>

			<div>
				<label for="auth-password" class="block text-xs font-medium text-slate-400 mb-1">Password</label>
				<input
					id="auth-password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
			>
				{#if loading}
					<Loader2 class="w-5 h-5 animate-spin" />
					<span>Signing In...</span>
				{:else}
					<LogIn class="w-5 h-5" />
					<span>Sign In</span>
				{/if}
			</button>
		</form>

		<div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
			<Lock class="w-3.5 h-3.5" />
			<span>Private 2-user instance (Public registration disabled)</span>
		</div>
	</div>
</div>
