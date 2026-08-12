export type TransactionType = 'deposit' | 'withdrawal';

export interface SavingTransaction {
	id: string;
	user_id: string;
	target_id: string;
	source_account_id: string | null;
	transaction_date: string;
	transaction_type: TransactionType;
	amount: number;
	notes: string | null;
	created_at: string;
	// Joined metadata
	saving_targets?: {
		id: string;
		title: string;
		target_amount: number;
	} | null;
	saving_accounts?: {
		id: string;
		name: string;
		type: string;
	} | null;
}

export interface CreateTransactionDTO {
	target_id: string;
	amount: number;
	transaction_type: TransactionType;
	transaction_date?: string;
	source_account_id?: string | null;
	notes?: string | null;
}

export interface TargetBalance {
	target_id: string;
	user_id: string;
	title: string;
	target_amount: number;
	start_date: string;
	target_date: string;
	priority: string;
	status: string;
	current_balance: number;
	remaining_amount: number;
}
