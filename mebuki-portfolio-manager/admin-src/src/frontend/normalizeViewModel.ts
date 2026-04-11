import { toFormState } from '../lib/mergeSettings';
import type { MebukiFormState } from '../types/settings';

export type HeroConfig = {
	title: string;
	subtitle: string;
	cover_image_url: string;
};

export type CredoConfig = {
	title: string;
	body: string;
};

export interface FrontendViewModel extends MebukiFormState {
	hero: HeroConfig | null;
	credo: CredoConfig | null;
}

function pickHero( raw: Record<string, unknown> | undefined ): HeroConfig | null {
	if ( ! raw ) {
		return null;
	}
	const h = raw.hero;
	if ( ! h || typeof h !== 'object' ) {
		return null;
	}
	const o = h as Record<string, unknown>;
	const title = typeof o.title === 'string' ? o.title.trim() : '';
	const subtitle = typeof o.subtitle === 'string' ? o.subtitle.trim() : '';
	const cover_image_url =
		typeof o.cover_image_url === 'string' ? o.cover_image_url.trim() : '';
	if ( ! title && ! subtitle && ! cover_image_url ) {
		return null;
	}
	return { title, subtitle, cover_image_url };
}

function pickCredo( raw: Record<string, unknown> | undefined ): CredoConfig | null {
	if ( ! raw ) {
		return null;
	}
	const c = raw.credo;
	if ( ! c || typeof c !== 'object' ) {
		return null;
	}
	const o = c as Record<string, unknown>;
	const title = typeof o.title === 'string' ? o.title.trim() : '';
	const body = typeof o.body === 'string' ? o.body.trim() : '';
	if ( ! title && ! body ) {
		return null;
	}
	return { title, body };
}

export function toFrontendViewModel(
	raw: Record<string, unknown> | undefined
): FrontendViewModel {
	const base = toFormState( raw );
	const r = raw ?? {};
	return {
		...base,
		hero: pickHero( r ),
		credo: pickCredo( r ),
	};
}
