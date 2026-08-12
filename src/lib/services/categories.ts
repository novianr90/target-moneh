import { supabase } from './supabase';
import type { SavingCategory, CreateCategoryDTO, UpdateCategoryDTO } from '$lib/types/category';

export const categoriesService = {
	async getCategories(includeArchived = false): Promise<SavingCategory[]> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return [];

		let query = supabase
			.from('saving_categories')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (!includeArchived) {
			query = query.is('archived_at', null);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data as SavingCategory[];
	},

	async getCategoryById(id: string): Promise<SavingCategory | null> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return null;

		const { data, error } = await supabase
			.from('saving_categories')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single();

		if (error) throw error;
		return data as SavingCategory;
	},

	async createCategory(payload: CreateCategoryDTO): Promise<SavingCategory> {
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) throw new Error('User must be authenticated to create categories');

		const trimmedName = payload.name.trim();

		// Case-insensitive duplicate check per user
		const { data: existing } = await supabase
			.from('saving_categories')
			.select('id')
			.eq('user_id', user.id)
			.ilike('name', trimmedName)
			.maybeSingle();

		if (existing) {
			throw new Error(`A category named "${trimmedName}" already exists.`);
		}

		const { data, error } = await supabase
			.from('saving_categories')
			.insert({
				user_id: user.id,
				name: trimmedName,
				icon: payload.icon || 'piggy-bank',
				color: payload.color || '#10B981'
			})
			.select()
			.single();

		if (error) {
			if (error.code === '23505') {
				throw new Error(`A category named "${trimmedName}" already exists.`);
			}
			throw error;
		}
		return data as SavingCategory;
	},

	async updateCategory(id: string, payload: UpdateCategoryDTO): Promise<SavingCategory> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const updates: Record<string, any> = {};

		if (payload.name !== undefined) {
			const trimmedName = payload.name.trim();
			updates.name = trimmedName;

			// Case-insensitive duplicate check per user
			const { data: existing } = await supabase
				.from('saving_categories')
				.select('id')
				.eq('user_id', user.id)
				.ilike('name', trimmedName)
				.neq('id', id)
				.maybeSingle();

			if (existing) {
				throw new Error(`A category named "${trimmedName}" already exists.`);
			}
		}
		if (payload.icon !== undefined) {
			updates.icon = payload.icon;
		}
		if (payload.color !== undefined) {
			updates.color = payload.color;
		}

		const { data, error } = await supabase
			.from('saving_categories')
			.update(updates)
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) {
			if (error.code === '23505') {
				throw new Error(`A category named "${updates.name}" already exists.`);
			}
			throw error;
		}
		return data as SavingCategory;
	},

	async archiveCategory(id: string): Promise<SavingCategory> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const { data, error } = await supabase
			.from('saving_categories')
			.update({
				archived_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;
		return data as SavingCategory;
	},

	async unarchiveCategory(id: string): Promise<SavingCategory> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('User must be authenticated');

		const { data, error } = await supabase
			.from('saving_categories')
			.update({
				archived_at: null
			})
			.eq('id', id)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;
		return data as SavingCategory;
	}
};
