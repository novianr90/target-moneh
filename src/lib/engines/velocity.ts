import type { EngineTransaction } from './types';
import { parseDate } from './periods';

export interface VelocityResult {
	velocity: number;
	windowMonthsCount: number;
	includedYearMonths: string[]; // List of "YYYY-MM" included
}

/**
 * 7.3 Deterministic Savings Velocity
 * Measures historical net monthly savings rate over the latest completed calendar months, capped at 6.
 */
export function getSavingsVelocity(
	startDateInput: string | Date,
	transactions: EngineTransaction[] = [],
	todayInput: string | Date = new Date()
): VelocityResult {
	const startDate = parseDate(startDateInput);
	const today = parseDate(todayInput);

	// 1. Determine first_transaction_date if any
	let firstTxDate: Date | null = null;
	if (transactions.length > 0) {
		const sortedTxDates = transactions
			.map((tx) => parseDate(tx.transaction_date))
			.sort((a, b) => a.getTime() - b.getTime());
		firstTxDate = sortedTxDates[0];
	}

	// 2. velocity_start: First day of calendar month containing MAX(start_date, first_transaction_date)
	let startRefDate = startDate;
	if (firstTxDate && firstTxDate > startDate) {
		startRefDate = firstTxDate;
	}
	const velocityStartYear = startRefDate.getFullYear();
	const velocityStartMonth = startRefDate.getMonth(); // 0-indexed

	// 3. velocity_end: Last day of previous calendar month before `today`
	// The last completed month is `today`'s month minus 1
	const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	const velocityEndYear = prevMonthDate.getFullYear();
	const velocityEndMonth = prevMonthDate.getMonth();

	// Calculate total completed months between startRefDate and prevMonthDate
	const totalEligibleMonthsCount =
		(velocityEndYear - velocityStartYear) * 12 + (velocityEndMonth - velocityStartMonth) + 1;

	if (totalEligibleMonthsCount <= 0) {
		return {
			velocity: 0,
			windowMonthsCount: 0,
			includedYearMonths: []
		};
	}

	// Generate all eligible month keys "YYYY-MM"
	const eligibleMonths: { year: number; month: number; key: string }[] = [];
	for (let i = 0; i < totalEligibleMonthsCount; i++) {
		const mDate = new Date(velocityStartYear, velocityStartMonth + i, 1);
		const year = mDate.getFullYear();
		const month = mDate.getMonth();
		const key = `${year}-${String(month + 1).padStart(2, '0')}`;
		eligibleMonths.push({ year, month, key });
	}

	// Step 2: Select latest min(6, count(EligibleMonths))
	const includedMonths = eligibleMonths.slice(-6);
	const W = includedMonths.length;

	if (W === 0) {
		return {
			velocity: 0,
			windowMonthsCount: 0,
			includedYearMonths: []
		};
	}

	const includedKeysSet = new Set(includedMonths.map((m) => m.key));

	// Step 3: Compute net contributions for transactions falling inside IncludedMonths
	let totalNetContribution = 0;
	for (const tx of transactions) {
		const txDate = parseDate(tx.transaction_date);
		const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

		if (includedKeysSet.has(txKey)) {
			if (tx.transaction_type === 'deposit') {
				totalNetContribution += tx.amount;
			} else if (tx.transaction_type === 'withdrawal') {
				totalNetContribution -= tx.amount;
			}
		}
	}

	// Velocity = sum(net contributions in IncludedMonths) / W
	const velocity = totalNetContribution / W;

	return {
		velocity: Math.round(velocity),
		windowMonthsCount: W,
		includedYearMonths: includedMonths.map((m) => m.key)
	};
}
