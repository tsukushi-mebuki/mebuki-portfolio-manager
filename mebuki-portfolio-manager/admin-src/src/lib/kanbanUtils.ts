import type { KanbanColumnId, OrderRow } from '../types/order';

/**
 * Maps DB status to a Kanban column (`new` and unknown → pending).
 */
export function boardColumnForStatus( status: string ): KanbanColumnId {
	if ( status === 'in_progress' ) {
		return 'in_progress';
	}
	if ( status === 'completed' ) {
		return 'completed';
	}
	return 'pending';
}

export function ordersByColumn(
	orders: OrderRow[]
): Record<KanbanColumnId, OrderRow[]> {
	const buckets: Record<KanbanColumnId, OrderRow[]> = {
		pending: [],
		in_progress: [],
		completed: [],
	};
	for ( const o of orders ) {
		buckets[ boardColumnForStatus( o.status ) ].push( o );
	}
	return buckets;
}

export function formatYen( amount: number ): string {
	return new Intl.NumberFormat( 'ja-JP', {
		style: 'currency',
		currency: 'JPY',
		maximumFractionDigits: 0,
	} ).format( amount );
}

export function formatOrderDate( iso: string | null ): string {
	if ( ! iso ) {
		return '—';
	}
	const d = new Date( iso );
	if ( Number.isNaN( d.getTime() ) ) {
		return iso;
	}
	return d.toLocaleString( 'ja-JP', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	} );
}
