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
	try {
		const u = new URL( 'reviews/', base.endsWith( '/' ) ? base : `${ base }/` );
		u.searchParams.set( 'mebuki_review_target', itemType );
		u.searchParams.set( 'item_id', itemId );
		return u.toString();
	} catch {
		return '#';
	}
}
