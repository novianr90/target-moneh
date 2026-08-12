export type GoalStatus = 'active' | 'paused' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal';

export type GoalHealthStatus =
	| 'achieved'
	| 'overdue'
	| 'on_track'
	| 'needs_attention'
	| 'behind_schedule'
	| 'paused'
	| 'cancelled';

export interface EngineTransaction {
	id?: string;
	transaction_date: string; // YYYY-MM-DD
	transaction_type: TransactionType;
	amount: number;
}

export interface GoalInput {
	id?: string;
	title?: string;
	target_amount: number;
	start_date: string; // YYYY-MM-DD
	target_date: string; // YYYY-MM-DD
	status: GoalStatus;
	current_balance: number;
	transactions?: EngineTransaction[];
}

export interface HealthMeta {
	status: GoalHealthStatus;
	label: string;
	badge: string;
	colorClass: string;
	description: string;
}

export interface GoalMetrics {
	target_id?: string;
	target_amount: number;
	current_balance: number;
	remaining_amount: number;
	remaining_months: number;
	required_monthly_savings: number | null; // null if overdue or achieved
	savings_velocity: number;
	velocity_months_count: number;
	projected_months_needed: number | null; // null if velocity <= 0 or achieved
	projected_completion_date: string | null; // e.g. "November 2026" or null
	projected_completion_text: string;
	health: HealthMeta;
}
