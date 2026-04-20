import { joinRestPath } from '../frontend/restUrl';

export type CreatePublicReviewBody = {
	user_slug: string;
	item_type: string;
	item_id: string;
	reviewer_name: string;
	reviewer_thumbnail_url: string;
	review_text: string;
};

export type CreatePublicReviewResult =
	| { ok: true; data: unknown }
	| { ok: false; status: number; message: string };

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
	const res = await fetch( url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify( body ),
	} );

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
