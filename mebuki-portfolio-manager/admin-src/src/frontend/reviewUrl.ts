/**
 * Issue #7 口コミフォーム用 URL（クエリにターゲットを付与）。
 */
export function buildReviewWriteUrl(
	siteUrl: string,
	itemType: string,
	itemId: string
): string {
	const base = siteUrl.trim();
	if ( base === '' ) {
		return '#';
	}
	const withSlash = base.endsWith( '/' ) ? base : `${ base }/`;
	try {
		const u = new URL( withSlash );
		u.searchParams.set( 'mebuki_review_target', itemType );
		u.searchParams.set( 'item_id', itemId );
		return u.toString();
	} catch {
		return '#';
	}
}
