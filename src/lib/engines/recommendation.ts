import type { GoalInput, GoalMetrics } from './types';
import { getRemainingMonths, getRequiredMonthlySavings } from './periods';
import { getSavingsVelocity } from './velocity';
import { getProjectedCompletion } from './forecast';
import { getGoalHealth } from './health';

/**
 * Deterministic Goal Recommendation & Metric Calculation Engine
 */
export function calculateGoalMetrics(goal: GoalInput, todayInput: string | Date = new Date()): GoalMetrics {
	const currentBalance = Math.max(0, goal.current_balance || 0);
	const targetAmount = Math.max(0, goal.target_amount || 0);
	const remainingAmount = Math.max(0, targetAmount - currentBalance);

	// 1. Remaining Contribution Periods
	const remainingMonths = getRemainingMonths(goal.target_date, todayInput);

	// 2. Required Monthly Savings
	const requiredMonthlySavings = getRequiredMonthlySavings(currentBalance, targetAmount, remainingMonths);

	// 3. Savings Velocity
	const velocityResult = getSavingsVelocity(goal.start_date, goal.transactions || [], todayInput);
	const savingsVelocity = velocityResult.velocity;

	// 4. Projected Completion Forecast
	const forecastResult = getProjectedCompletion(currentBalance, targetAmount, savingsVelocity, todayInput);

	// 5. Goal Health Evaluation
	const health = getGoalHealth(
		goal.status,
		currentBalance,
		targetAmount,
		remainingMonths,
		requiredMonthlySavings,
		savingsVelocity
	);

	return {
		target_id: goal.id,
		target_amount: targetAmount,
		current_balance: currentBalance,
		remaining_amount: remainingAmount,
		remaining_months: remainingMonths,
		required_monthly_savings: requiredMonthlySavings,
		savings_velocity: savingsVelocity,
		velocity_months_count: velocityResult.windowMonthsCount,
		projected_months_needed: forecastResult.monthsNeeded,
		projected_completion_date: forecastResult.completionDateFormatted,
		projected_completion_text: forecastResult.completionText,
		health
	};
}
