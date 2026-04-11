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
	const withSlash = trimmed.endsWith( '/' ) ? trimmed : `${ trimmed }/`;
	const url = new URL( withSlash );
	url.searchParams.set( 'mebuki_review_target', itemType );
	url.searchParams.set( 'item_id', itemId );
	return url.toString();
}
