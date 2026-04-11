import type { OrderRow, OrderWorkflowStatus } from '../types/order';

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

function ordersMeUrl( root: string ): string {
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	return `${ base }mebuki-pm/v1/orders/me`;
}

function orderItemUrl( root: string, id: number ): string {
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	return `${ base }mebuki-pm/v1/orders/${ id }`;
}

export async function fetchOrdersMe(
	root: string,
	nonce: string
): Promise<OrderRow[]> {
	const res = await fetch( ordersMeUrl( root ), {
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'X-WP-Nonce': nonce,
		},
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
	const data = ( await res.json() ) as { orders?: unknown };
	if ( ! data.orders || ! Array.isArray( data.orders ) ) {
		return [];
	}
	return data.orders as OrderRow[];
}

export async function patchOrderStatus(
	root: string,
	nonce: string,
	orderId: number,
	status: OrderWorkflowStatus
): Promise<OrderRow> {
	const res = await fetch( orderItemUrl( root, orderId ), {
		method: 'PATCH',
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: JSON.stringify( { status } ),
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
	const data = ( await res.json() ) as { order?: OrderRow };
	if ( ! data.order ) {
		throw new Error( 'Invalid response' );
	}
	return data.order;
}
