import type { ReviewRow } from '../types/settings';

function toEpochMs( v: string | null ): number {
	if ( ! v ) {
		return 0;
	}
	const t = Date.parse( v );
	return Number.isNaN( t ) ? 0 : t;
}

/**
 * Primary: admin-defined sort_order (ascending). Tie-break: older created_at first.
 */
export function compareReviewsByDisplayOrder( a: ReviewRow, b: ReviewRow ): number {
	const d = ( a.sort_order ?? 0 ) - ( b.sort_order ?? 0 );
	if ( d !== 0 ) {
		return d;
	}
	return toEpochMs( a.created_at ) - toEpochMs( b.created_at );
}
