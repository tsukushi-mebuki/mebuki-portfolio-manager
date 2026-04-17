import { joinRestPath } from '../frontend/restUrl';

export type CreatePublicReviewBody = {
	user_id: number;
	item_type: string;
	item_id: string;
	reviewer_name: string;
	reviewer_thumbnail_url: string;
	review_text: string;
};

export type CreatePublicReviewResult =
	| { ok: true; data: unknown }
	| { ok: false; status: number; message: string };

function reviewsCreateFallbackUrl( root: string ): string {
	const originRoot = ( root || '/' ).trim();
	let origin = '';
	try {
		const u = new URL( originRoot, window.location.origin );
		origin = `${ u.origin }${ u.pathname.startsWith( '/' ) ? '' : '/' }`;
	} catch {
		origin = window.location.origin + '/';
	}
	const basePath = origin.endsWith( '/' ) ? origin : `${ origin }/`;
	return `${ basePath }?rest_route=/mebuki-pm/v1/reviews`;
}

function parseErrorMessage( raw: string, status: number ): string {
	try {
		const data = JSON.parse( raw ) as { message?: unknown };
		if ( data && typeof data === 'object' && typeof data.message === 'string' ) {
			const m = data.message.trim();
			if ( m !== '' ) {
				return m;
			}
		}
	} catch {
		/* ignore */
	}
	return `HTTP ${ status }`;
}

export async function postPublicReview(
	restRoot: string,
	body: CreatePublicReviewBody
): Promise<CreatePublicReviewResult> {
	const url = joinRestPath( restRoot, 'mebuki-pm/v1/reviews' );
	const req: RequestInit = {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify( body ),
	};
	let res = await fetch( url, req );
	if ( res.status === 404 ) {
		res = await fetch( reviewsCreateFallbackUrl( restRoot ), req );
	}

	const raw = await res.text();
	let data: unknown = null;
	try {
		data = raw ? JSON.parse( raw ) : null;
	} catch {
		data = null;
	}

	if ( res.ok ) {
		return { ok: true, data };
	}

	return {
		ok: false,
		status: res.status,
		message: parseErrorMessage( raw, res.status ),
	};
}
