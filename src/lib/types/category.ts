export interface SavingCategory {
	id: string;
	user_id: string;
	name: string;
	icon: string;
	color: string;
	archived_at: string | null;
	created_at: string;
}

export interface CreateCategoryDTO {
	name: string;
	icon?: string;
	color?: string;
}

export interface UpdateCategoryDTO {
	name?: string;
	icon?: string;
	color?: string;
}

// Preset color options for category badges
export const CATEGORY_PRESET_COLORS = [
	'#10B981', // Emerald
	'#3B82F6', // Blue
	'#8B5CF6', // Purple
	'#EC4899', // Pink
	'#F59E0B', // Amber
	'#EF4444', // Red
	'#06B6D4', // Cyan
	'#6366F1', // Indigo
	'#84CC16', // Lime
	'#64748B'  // Slate
];

// Curated list of available Lucide icons for categories
export const CATEGORY_ICON_OPTIONS = [
	{ id: 'piggy-bank', label: 'Piggy Bank' },
	{ id: 'shield-check', label: 'Emergency / Shield' },
	{ id: 'home', label: 'House / Property' },
	{ id: 'plane', label: 'Vacation / Travel' },
	{ id: 'smartphone', label: 'Gadget / Tech' },
	{ id: 'graduation-cap', label: 'Education' },
	{ id: 'car', label: 'Vehicle / Transportation' },
	{ id: 'heart', label: 'Health / Medical' },
	{ id: 'gift', label: 'Gift / Celebration' },
	{ id: 'briefcase', label: 'Business / Career' },
	{ id: 'shopping-bag', label: 'Shopping' },
	{ id: 'landmark', label: 'Investment / Wealth' }
];
