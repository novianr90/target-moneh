<script lang="ts">
	import {
		PiggyBank,
		ShieldCheck,
		Home,
		Plane,
		Smartphone,
		GraduationCap,
		Car,
		Heart,
		Gift,
		Briefcase,
		ShoppingBag,
		Landmark,
		Folder
	} from '@lucide/svelte';

	interface Props {
		name: string;
		class?: string;
	}

	let { name, class: className = 'w-5 h-5' }: Props = $props();

	const IconComponent = $derived.by(() => {
		switch (name) {
			case 'piggy-bank':
				return PiggyBank;
			case 'shield-check':
				return ShieldCheck;
			case 'home':
				return Home;
			case 'plane':
				return Plane;
			case 'smartphone':
				return Smartphone;
			case 'graduation-cap':
				return GraduationCap;
			case 'car':
				return Car;
			case 'heart':
				return Heart;
			case 'gift':
				return Gift;
			case 'briefcase':
				return Briefcase;
			case 'shopping-bag':
				return ShoppingBag;
			case 'landmark':
				return Landmark;
			default:
				return PiggyBank;
		}
	});
</script>

{#if IconComponent}
	{@const Comp = IconComponent}
	<Comp class={className} />
{/if}
