import { supabase } from './supabase';
import type { SavingTransaction, CreateTransactionDTO, TargetBalance } from '$lib/types/transaction';

export const transactionsService = {
	async getTransactions(targetId?: string): Promise<SavingTransaction[]> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return [];

		let query = supabase
			.from('saving_transactions')
			.select(`
				*,
				saving_targets (
					id,
					title,
					target_amount
				),
				saving_accounts (
					id,
					name,
					type
				)
			`)
			.eq('user_id', user.id)
			.order('transaction_date', { ascending: false })
			.order('created_at', { ascending: false });

		if (targetId) {
			query = query.eq('target_id', targetId);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data as SavingTransaction[];
	},

	async getTargetBalances(): Promise<TargetBalance[]> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return [];

		const { data, error } = await supabase
			.from('v_saving_target_balances')
			.select('*')
			.eq('user_id', user.id);

		if (error) throw error;
		return data as TargetBalance[];
	},

	async getTargetBalanceById(targetId: string): Promise<TargetBalance | null> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return null;

		const { data, error } = await supabase
			.from('v_saving_target_balances')
			.select('*')
			.eq('target_id', targetId)
			.eq('user_id', user.id)
			.single();

		if (error && error.code !== 'PGRST116') throw error;
		return data as TargetBalance | null;
	},

	async createTransaction(payload: CreateTransactionDTO): Promise<SavingTransaction> {
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) throw new Error('User must be authenticated to record transactions');

		if (payload.amount <= 0) {
			throw new Error('Transaction amount must be greater than zero.');
		}

		// Validation for Withdrawal: Cannot withdraw more than target's current balance
		if (payload.transaction_type === 'withdrawal') {
			const currentBalanceInfo = await this.getTargetBalanceById(payload.target_id);
			const currentBalance = currentBalanceInfo?.current_balance || 0;

			if (payload.amount > currentBalance) {
				throw new Error(
					`Insufficient savings balance. Cannot withdraw Rp ${new Intl.NumberFormat('id-ID').format(payload.amount)} (Current goal balance: Rp ${new Intl.NumberFormat('id-ID').format(currentBalance)}).`
				);
			}
		}

		const { data, error } = await supabase
			.from('saving_transactions')
			.insert({
				user_id: user.id,
				target_id: payload.target_id,
				source_account_id: payload.source_account_id || null,
				transaction_date: payload.transaction_date || new Date().toISOString().split('T')[0],
				transaction_type: payload.transaction_type,
				amount: payload.amount,
				notes: payload.notes?.trim() || null
			})
			.select(`
				*,
				saving_targets (
					id,
					title,
					target_amount
				),
				saving_accounts (
					id,
					name,
					type
				)
			`)
			.single();

		if (error) throw error;
		return data as SavingTransaction;
	},

	async deleteTransaction(id: string): Promise<void> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const { error } = await supabase
			.from('saving_transactions')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) throw error;
	}
};
