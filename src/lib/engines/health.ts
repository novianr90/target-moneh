import type { GoalHealthStatus, GoalStatus, HealthMeta } from './types';

export const HEALTH_METADATA: Record<GoalHealthStatus, HealthMeta> = {
	achieved: {
		status: 'achieved',
		label: 'Achieved',
		badge: '🎉',
		colorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
		description: 'Goal target amount has been fully reached!'
	},
	overdue: {
		status: 'overdue',
		label: 'Overdue',
		badge: '🔴',
		colorClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
		description: 'Target deadline has passed without reaching full balance.'
	},
	on_track: {
		status: 'on_track',
		label: 'On Track',
		badge: '🟢',
		colorClass: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
		description: 'Current savings rate matches or exceeds required monthly rate.'
	},
	needs_attention: {
		status: 'needs_attention',
		label: 'Needs Attention',
		badge: '🟡',
		colorClass: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
		description: 'Savings rate is between 70% and 99% of required monthly target.'
	},
	behind_schedule: {
		status: 'behind_schedule',
		label: 'Behind Schedule',
		badge: '🔴',
		colorClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
		description: 'Savings rate is below 70% of required target or velocity is negative/zero.'
	},
	paused: {
		status: 'paused',
		label: 'Paused',
		badge: '⏸️',
		colorClass: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
		description: 'Goal is currently paused.'
	},
	cancelled: {
		status: 'cancelled',
		label: 'Cancelled',
		badge: '⚫',
		colorClass: 'bg-slate-900 text-slate-400 border-slate-800',
		description: 'Goal is cancelled.'
	}
};

/**
 * 7.5 Goal Health Evaluation
 * Evaluated in strict precedence order for active goals.
 */
export function getGoalHealth(
	status: GoalStatus,
	currentBalance: number,
	targetAmount: number,
	remainingMonths: number,
	requiredMonthlySavings: number | null,
	savingsVelocity: number
): HealthMeta {
	// Step 1: Check Goal Lifecycle
	if (status === 'cancelled') {
		return HEALTH_METADATA.cancelled;
	}
	if (status === 'paused') {
		return HEALTH_METADATA.paused;
	}

	// Step 2: Compute Health for Active Goals (Strict Precedence)

	// Priority 1: Achieved
	if (currentBalance >= targetAmount) {
		return HEALTH_METADATA.achieved;
	}

	// Priority 2: Overdue (Deadline passed AND not achieved)
	if (remainingMonths < 0) {
		return HEALTH_METADATA.overdue;
	}

	// For Priority 3-5: Velocity vs Required comparison
	if (requiredMonthlySavings !== null && requiredMonthlySavings > 0) {
		// Priority 3: On Track (Velocity >= Required)
		if (savingsVelocity >= requiredMonthlySavings) {
			return HEALTH_METADATA.on_track;
		}

		// Priority 4: Needs Attention (Velocity >= 0.70 * Required)
		if (savingsVelocity >= 0.7 * requiredMonthlySavings) {
			return HEALTH_METADATA.needs_attention;
		}
	}

	// Priority 5: Behind Schedule (All other cases, including velocity <= 0 or < 70% required)
	return HEALTH_METADATA.behind_schedule;
}
