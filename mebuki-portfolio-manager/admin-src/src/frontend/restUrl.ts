/**
 * Build absolute REST URLs from `rest_url()` root (with or without trailing slash).
 */
export function joinRestPath( restRoot: string, path: string ): string {
	const root = restRoot.trim();
	if ( root === '' ) {
		return path.startsWith( '/' ) ? path : `/${ path }`;
	}
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	const rel = path.replace( /^\//, '' );
	try {
		return new URL( rel, base ).href;
	} catch {
		return `${ base }${ rel }`;
	}
}

export function publishedReviewsUrl( restRoot: string, userId: number ): string {
	const u = new URL( joinRestPath( restRoot, 'mebuki-pm/v1/reviews/published' ) );
	u.searchParams.set( 'user_id', String( userId ) );
	return u.href;
}
