import { supabase } from './supabase';
import type { SavingTarget, CreateTargetDTO, UpdateTargetDTO, TargetStatus } from '$lib/types/target';

export const targetsService = {
	async getTargets(statusFilter: TargetStatus | 'all' = 'all'): Promise<SavingTarget[]> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return [];

		let query = supabase
			.from('saving_targets')
			.select(`
				*,
				saving_categories (
					id,
					name,
					color,
					icon
				)
			`)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (statusFilter !== 'all') {
			query = query.eq('status', statusFilter);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data as SavingTarget[];
	},

	async getTargetById(id: string): Promise<SavingTarget | null> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return null;

		const { data, error } = await supabase
			.from('saving_targets')
			.select(`
				*,
				saving_categories (
					id,
					name,
					color,
					icon
				)
			`)
			.eq('id', id)
			.eq('user_id', user.id)
			.single();

		if (error) throw error;
		return data as SavingTarget;
	},

	async createTarget(payload: CreateTargetDTO): Promise<SavingTarget> {
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) throw new Error('User must be authenticated to create targets');

		if (payload.target_amount <= 0) {
			throw new Error('Target amount must be greater than zero.');
		}

		if (new Date(payload.target_date) < new Date(payload.start_date)) {
			throw new Error('Target deadline date must be equal to or after the start date.');
		}

		const { data, error } = await supabase
			.from('saving_targets')
			.insert({
				user_id: user.id,
				title: payload.title.trim(),
				target_amount: payload.target_amount,
				start_date: payload.start_date,
				target_date: payload.target_date,
				category_id: payload.category_id || null,
				priority: payload.priority || 'medium',
				status: 'active',
				notes: payload.notes?.trim() || null
			})
			.select(`
				*,
				saving_categories (
					id,
					name,
					color,
					icon
				)
			`)
			.single();

		if (error) throw error;
		return data as SavingTarget;
	},

	async updateTarget(id: string, payload: UpdateTargetDTO): Promise<SavingTarget> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		if (payload.target_amount !== undefined && payload.target_amount <= 0) {
			throw new Error('Target amount must be greater than zero.');
		}

		if (payload.target_date && payload.start_date && new Date(payload.target_date) < new Date(payload.start_date)) {
			throw new Error('Target deadline date must be equal to or after the start date.');
		}

		const updates: Record<string, any> = {
			updated_at: new Date().toISOString()
		};

		if (payload.title !== undefined) updates.title = payload.title.trim();
		if (payload.target_amount !== undefined) updates.target_amount = payload.target_amount;
		if (payload.start_date !== undefined) updates.start_date = payload.start_date;
		if (payload.target_date !== undefined) updates.target_date = payload.target_date;
		if (payload.category_id !== undefined) updates.category_id = payload.category_id || null;
		if (payload.priority !== undefined) updates.priority = payload.priority;
		if (payload.status !== undefined) updates.status = payload.status;
		if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;

		const { data, error } = await supabase
			.from('saving_targets')
			.update(updates)
			.eq('id', id)
			.eq('user_id', user.id)
			.select(`
				*,
				saving_categories (
					id,
					name,
					color,
					icon
				)
			`)
			.single();

		if (error) throw error;
		return data as SavingTarget;
	},

	async deleteTarget(id: string): Promise<void> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		// Check if target has existing transactions before attempting deletion
		const { count, error: countError } = await supabase
			.from('saving_transactions')
			.select('id', { count: 'exact', head: true })
			.eq('target_id', id)
			.eq('user_id', user.id);

		if (countError && countError.code !== 'PGRST116') {
			// Ignore table missing error during early migration setup, otherwise check
		} else if (count && count > 0) {
			throw new Error('Goals with existing transactions cannot be hard-deleted. Please set status to "Cancelled" instead.');
		}

		const { error } = await supabase
			.from('saving_targets')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) {
			if (error.code === '23503') {
				throw new Error('Goals with existing transactions cannot be hard-deleted. Please set status to "Cancelled" instead.');
			}
			throw error;
		}
	}
};
