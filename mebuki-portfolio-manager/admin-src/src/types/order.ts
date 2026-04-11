/** Kanban columns map to these DB `status` values. */
export type OrderWorkflowStatus = 'pending' | 'in_progress' | 'completed';

export type KanbanColumnId = OrderWorkflowStatus;

export interface OrderRow {
	id: number;
	user_id: number;
	uuid: string;
	client_name: string;
	client_email: string;
	status: string;
	total_amount: number;
	order_details: unknown;
	created_at: string | null;
}
