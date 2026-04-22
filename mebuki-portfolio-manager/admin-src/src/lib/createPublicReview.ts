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

export type PostPublicReviewOptions = {
	reviewerAvatarFile?: File | null;
};

export async function postPublicReview(
	restRoot: string,
	body: CreatePublicReviewBody,
	options?: PostPublicReviewOptions
): Promise<CreatePublicReviewResult> {
	const url = joinRestPath( restRoot, 'mebuki-pm/v1/reviews' );
	const avatar = options?.reviewerAvatarFile ?? null;
	let res: Response;
	if ( avatar ) {
		const fd = new FormData();
		fd.append( 'user_slug', body.user_slug );
		fd.append( 'item_type', body.item_type );
		fd.append( 'item_id', body.item_id );
		fd.append( 'reviewer_name', body.reviewer_name );
		fd.append( 'review_text', body.review_text );
		fd.append( 'reviewer_avatar', avatar );
		res = await fetch( url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				Accept: 'application/json',
			},
			body: fd,
		} );
	} else {
		res = await fetch( url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify( body ),
		} );
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
