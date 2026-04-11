import type { ReviewRow } from '../types/settings';

async function readErrorMessage( res: Response ): Promise<string> {
	try {
		const j: unknown = await res.json();
		if ( j && typeof j === 'object' && 'message' in j ) {
			const m = ( j as { message?: unknown } ).message;
			if ( typeof m === 'string' && m !== '' ) {
				return m;
			}
		}
	} catch {
		// ignore
	}
	return `HTTP ${ res.status }`;
}

function reviewsMeUrl( root: string ): string {
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	return `${ base }mebuki-pm/v1/reviews/me`;
}

function reviewItemUrl( root: string, id: number ): string {
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	return `${ base }mebuki-pm/v1/reviews/${ id }`;
}

export async function fetchReviewsMe(
	root: string,
	nonce: string
): Promise<ReviewRow[]> {
	const res = await fetch( reviewsMeUrl( root ), {
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'X-WP-Nonce': nonce,
		},
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
	const data = ( await res.json() ) as { reviews?: unknown };
	if ( ! data.reviews || ! Array.isArray( data.reviews ) ) {
		return [];
	}
	return data.reviews as ReviewRow[];
}

export async function patchReviewVisibility(
	root: string,
	nonce: string,
	reviewId: number,
	visibility: 'public' | 'private'
): Promise<ReviewRow> {
	const res = await fetch( reviewItemUrl( root, reviewId ), {
		method: 'PATCH',
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: JSON.stringify( { visibility } ),
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
	const data = ( await res.json() ) as { review?: ReviewRow };
	if ( ! data.review ) {
		throw new Error( 'Invalid response' );
	}
	return data.review;
}
