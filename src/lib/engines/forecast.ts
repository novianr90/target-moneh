import { parseDate } from './periods';

export interface ForecastResult {
	monthsNeeded: number | null;
	completionDateFormatted: string | null;
	completionText: string;
}

const MONTH_NAMES_ID = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];

/**
 * 7.4 Projected Completion Forecast (Velocity-Only v1.0)
 * Calculates projected months needed and projected completion month text.
 */
export function getProjectedCompletion(
	currentBalance: number,
	targetAmount: number,
	velocity: number,
	todayInput: string | Date = new Date()
): ForecastResult {
	if (currentBalance >= targetAmount) {
		const today = parseDate(todayInput);
		const formatted = `${MONTH_NAMES_ID[today.getMonth()]} ${today.getFullYear()}`;
		return {
			monthsNeeded: 0,
			completionDateFormatted: formatted,
			completionText: 'Achieved'
		};
	}

	if (velocity <= 0) {
		return {
			monthsNeeded: null,
			completionDateFormatted: null,
			completionText: 'Not achievable at current rate'
		};
	}

	const remainingAmount = targetAmount - currentBalance;
	const monthsNeeded = Math.ceil(remainingAmount / velocity);

	const today = parseDate(todayInput);
	const targetDate = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, 1);
	const formatted = `${MONTH_NAMES_ID[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

	return {
		monthsNeeded,
		completionDateFormatted: formatted,
		completionText: formatted
	};
}
