/**
 * 口コミ収集用の公開サイト URL（Epic 3 でクエリを解釈してモーダル展開予定）
 */
export function buildReviewCollectionUrl(
	siteRoot: string,
	itemType: string,
	itemId: string
): string {
	const trimmed = siteRoot.trim();
	if ( trimmed === '' ) {
		return '';
	}
	const url = new URL(
		'reviews/',
		trimmed.endsWith( '/' ) ? trimmed : `${ trimmed }/`
	);
	url.searchParams.set( 'mebuki_review_target', itemType );
	url.searchParams.set( 'item_id', itemId );
	return url.toString();
}
