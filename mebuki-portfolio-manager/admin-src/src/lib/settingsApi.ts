import type { SettingsMeResponse } from '../types/settings';

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

function settingsMeUrl( root: string ): string {
	const base = root.endsWith( '/' ) ? root : `${ root }/`;
	return `${ base }mebuki-pm/v1/settings/me`;
}

function settingsMeFallbackUrl( root: string ): string {
	const originRoot = ( root || '/' ).trim();
	let origin = '';
	try {
		const u = new URL( originRoot, window.location.origin );
		origin = `${ u.origin }${ u.pathname.startsWith( '/' ) ? '' : '/' }`;
	} catch {
		origin = window.location.origin + '/';
	}
	const basePath = origin.endsWith( '/' ) ? origin : `${ origin }/`;
	return `${ basePath }?rest_route=/mebuki-pm/v1/settings/me`;
}

async function fetchSettingsMeWithFallback(
	root: string,
	nonce: string,
	init?: Omit<RequestInit, 'headers'>
): Promise<Response> {
	const headers: HeadersInit = {
		Accept: 'application/json',
		'X-WP-Nonce': nonce,
		...( init?.method && init.method !== 'GET'
			? { 'Content-Type': 'application/json' }
			: {} ),
	};
	const first = await fetch( settingsMeUrl( root ), {
		...init,
		credentials: 'same-origin',
		headers,
	} );
	if ( first.status !== 404 ) {
		return first;
	}
	return fetch( settingsMeFallbackUrl( root ), {
		...init,
		credentials: 'same-origin',
		headers,
	} );
}

export async function fetchSettingsMe(
	root: string,
	nonce: string
): Promise<SettingsMeResponse> {
	const res = await fetchSettingsMeWithFallback( root, nonce );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
	return res.json() as Promise<SettingsMeResponse>;
}

export async function saveSettingsMe(
	root: string,
	nonce: string,
	payload: Record<string, unknown>
): Promise<void> {
	const res = await fetchSettingsMeWithFallback( root, nonce, {
		method: 'POST',
		body: JSON.stringify( payload ),
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
}
