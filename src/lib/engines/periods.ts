/**
 * Helper to parse YYYY-MM-DD or Date object into a clean local Date object
 */
export function parseDate(dateInput: string | Date): Date {
	if (dateInput instanceof Date) return dateInput;
	const [year, month, day] = dateInput.split('-').map(Number);
	return new Date(year, month - 1, day || 1);
}

/**
 * 7.1 Remaining Contribution Periods (Calendar-Month Model)
 * N_months = (YEAR(target_date) - YEAR(today)) * 12 + (MONTH(target_date) - MONTH(today))
 */
export function getRemainingMonths(targetDateInput: string | Date, todayInput: string | Date = new Date()): number {
	const targetDate = parseDate(targetDateInput);
	const today = parseDate(todayInput);

	return (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
}

/**
 * 7.2 Required Monthly Savings
 * Formula:
 * - 0 if Achieved (current_balance >= target_amount)
 * - null (Overdue) if N_months < 0
 * - remaining_amount if N_months === 0 (current month deadline)
 * - remaining_amount / N_months if N_months >= 1
 */
export function getRequiredMonthlySavings(
	currentBalance: number,
	targetAmount: number,
	remainingMonths: number
): number | null {
	if (currentBalance >= targetAmount) {
		return 0;
	}

	const remainingAmount = Math.max(targetAmount - currentBalance, 0);

	if (remainingMonths < 0) {
		return null; // Overdue signal
	}

	if (remainingMonths === 0) {
		return remainingAmount;
	}

	return Math.ceil(remainingAmount / remainingMonths);
}
