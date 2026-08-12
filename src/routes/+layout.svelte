<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto, invalidate } from '$app/navigation';
	import { supabase } from '$lib/services/supabase';
	import { authService } from '$lib/services/auth';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Target, LogOut, LogIn, LayoutDashboard, Landmark } from '@lucide/svelte';

	let { data, children } = $props();

	let currentUser = $derived(data.user);
	let currentPath = $derived(page.url.pathname);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5,
				refetchOnWindowFocus: false
			}
		}
	});

	async function handleSignOut() {
		try {
			await authService.signOut();
			await invalidate('supabase:auth');
			goto('/auth');
		} catch (e) {
			console.error('Sign out error:', e);
		}
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
		<!-- Top Header -->
		<header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
			<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
				<div class="flex items-center gap-8">
					<a href="/" class="flex items-center gap-2.5 font-black text-xl text-white">
						<div class="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
							<Target class="w-5 h-5" />
						</div>
						<span>Target<span class="text-emerald-400">Moneh</span></span>
					</a>

					{#if currentUser}
						<nav class="hidden md:flex items-center gap-1">
							<a
								href="/"
								class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors {currentPath === '/' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
							>
								<LayoutDashboard class="w-3.5 h-3.5" />
								<span>Dashboard</span>
							</a>
							<a
								href="/accounts"
								class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors {currentPath.startsWith('/accounts') ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
							>
								<Landmark class="w-3.5 h-3.5" />
								<span>Accounts</span>
							</a>
						</nav>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					{#if currentUser}
						<button
							onclick={handleSignOut}
							class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
						>
							<LogOut class="w-3.5 h-3.5" />
							<span>Sign Out ({currentUser.email?.split('@')[0]})</span>
						</button>
					{:else}
						<a
							href="/auth"
							class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
						>
							<LogIn class="w-3.5 h-3.5" />
							<span>Sign In</span>
						</a>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
			{@render children()}
		</main>
	</div>
</QueryClientProvider>
