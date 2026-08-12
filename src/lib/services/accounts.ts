import { supabase } from './supabase';
import type { SavingAccount, CreateAccountDTO, UpdateAccountDTO } from '$lib/types/account';

export const accountsService = {
	async getAccounts(includeArchived = false): Promise<SavingAccount[]> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return [];

		let query = supabase
			.from('saving_accounts')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (!includeArchived) {
			query = query.is('archived_at', null);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data as SavingAccount[];
	},

	async getAccountById(id: string): Promise<SavingAccount | null> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return null;

		const { data, error } = await supabase
			.from('saving_accounts')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single();

		if (error) throw error;
		return data as SavingAccount;
	},

	async createAccount(payload: CreateAccountDTO): Promise<SavingAccount> {
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) throw new Error('User must be authenticated to create accounts');

		const { data, error } = await supabase
			.from('saving_accounts')
			.insert({
				user_id: user.id,
				name: payload.name.trim(),
				type: payload.type
			})
			.select()
			.single();

		if (error) throw error;
		return data as SavingAccount;
	},

	async updateAccount(id: string, payload: UpdateAccountDTO): Promise<SavingAccount> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const updates: Record<string, any> = {
			updated_at: new Date().toISOString()
		};

		if (payload.name !== undefined) {
			updates.name = payload.name.trim();
		}
		if (payload.type !== undefined) {
			updates.type = payload.type;
		}

		const { data, error } = await supabase
			.from('saving_accounts')
			.update(updates)
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;
		return data as SavingAccount;
	},

	async archiveAccount(id: string): Promise<SavingAccount> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const { data, error } = await supabase
			.from('saving_accounts')
			.update({
				archived_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;
		return data as SavingAccount;
	},

	async unarchiveAccount(id: string): Promise<SavingAccount> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const { data, error } = await supabase
			.from('saving_accounts')
			.update({
				archived_at: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;
		return data as SavingAccount;
	}
};
