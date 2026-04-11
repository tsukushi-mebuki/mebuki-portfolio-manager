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

export async function fetchSettingsMe(
	root: string,
	nonce: string
): Promise<SettingsMeResponse> {
	const res = await fetch( settingsMeUrl( root ), {
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'X-WP-Nonce': nonce,
		},
	} );
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
	const res = await fetch( settingsMeUrl( root ), {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: JSON.stringify( payload ),
	} );
	if ( ! res.ok ) {
		throw new Error( await readErrorMessage( res ) );
	}
}
