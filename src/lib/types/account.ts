export type AccountType = 'bank' | 'wallet' | 'investment' | 'cash';

export interface SavingAccount {
	id: string;
	user_id: string;
	name: string;
	type: AccountType;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateAccountDTO {
	name: string;
	type: AccountType;
}

export interface UpdateAccountDTO {
	name?: string;
	type?: AccountType;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, { label: string; iconName: string; colorClass: string }> = {
	bank: { label: 'Bank Account', iconName: 'Landmark', colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
	wallet: { label: 'E-Wallet', iconName: 'Wallet', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
	investment: { label: 'Investment', iconName: 'TrendingUp', colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
	cash: { label: 'Cash', iconName: 'Banknote', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
};
