import { joinRestPath } from '../frontend/restUrl';

/**
 * Body for POST /mebuki-pm/v1/orders (public; resolves owner by slug).
 */
export type CreatePublicOrderBody = {
	user_slug?: string;
	user_id?: number;
	uuid: string;
	client_name: string;
	client_email: string;
	message: string;
	total_amount: number;
	order_details_json: {
		category_name: string;
		course: { id: string; name: string };
		options: { id: string; name: string }[];
	};
};

export type CreatePublicOrderResult =
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

/**
 * Submit an inquiry order. Same uuid retries are idempotent (server returns existing row).
 */
export async function postPublicOrder(
	restRoot: string,
	body: CreatePublicOrderBody
): Promise<CreatePublicOrderResult> {
	const url = joinRestPath( restRoot, 'mebuki-pm/v1/orders' );
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
