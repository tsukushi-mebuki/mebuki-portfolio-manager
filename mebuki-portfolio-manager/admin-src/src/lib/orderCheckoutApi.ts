import { joinRestPath } from '../frontend/restUrl';
import type { CreatePublicOrderBody } from './createPublicOrder';

export type OrderCheckoutResult =
	| { ok: true; checkout_url: string; data: unknown }
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
 * POST /mebuki-pm/v1/orders/checkout — creates payment_pending order and returns Stripe Checkout URL.
 */
export async function postOrderCheckout(
	restRoot: string,
	body: CreatePublicOrderBody
): Promise<OrderCheckoutResult> {
	const url = joinRestPath( restRoot, 'mebuki-pm/v1/orders/checkout' );
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

	if ( res.ok && data && typeof data === 'object' ) {
		const o = data as { checkout_url?: unknown };
		if ( typeof o.checkout_url === 'string' && o.checkout_url !== '' ) {
			return { ok: true, checkout_url: o.checkout_url, data };
		}
	}

	return {
		ok: false,
		status: res.status,
		message: parseErrorMessage( raw, res.status ),
	};
}
