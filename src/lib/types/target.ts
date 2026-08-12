export type TargetPriority = 'high' | 'medium' | 'low';
export type TargetStatus = 'active' | 'paused' | 'cancelled';

export interface SavingTarget {
	id: string;
	user_id: string;
	category_id: string | null;
	title: string;
	target_amount: number;
	start_date: string;
	target_date: string;
	priority: TargetPriority;
	status: TargetStatus;
	notes: string | null;
	created_at: string;
	updated_at: string;
	// Joined category metadata
	saving_categories?: {
		id: string;
		name: string;
		color: string;
		icon: string;
	} | null;
}

export interface CreateTargetDTO {
	title: string;
	target_amount: number;
	start_date: string;
	target_date: string;
	category_id?: string | null;
	priority?: TargetPriority;
	notes?: string | null;
}

export interface UpdateTargetDTO {
	title?: string;
	target_amount?: number;
	start_date?: string;
	target_date?: string;
	category_id?: string | null;
	priority?: TargetPriority;
	status?: TargetStatus;
	notes?: string | null;
}

export const PRIORITY_LABELS: Record<TargetPriority, { label: string; colorClass: string }> = {
	high: { label: 'High Priority', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
	medium: { label: 'Medium Priority', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
	low: { label: 'Low Priority', colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
};

export const STATUS_LABELS: Record<TargetStatus, { label: string; colorClass: string }> = {
	active: { label: 'Active', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
	paused: { label: 'Paused', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
	cancelled: { label: 'Cancelled', colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
};
