import { toFormState } from '../lib/mergeSettings';
import type { MebukiFormState } from '../types/settings';

export interface FrontendViewModel extends MebukiFormState {
}

function pickHero( raw: Record<string, unknown> | undefined ): MebukiFormState['hero'] {
	const empty: MebukiFormState['hero'] = {
		title: '',
		subtitle: '',
		cover_image_url: '',
		overlay_image_url: '',
		overlay_image_align: 'center',
	};
	if ( ! raw ) {
		return empty;
	}
	const h = raw.hero;
	if ( ! h || typeof h !== 'object' ) {
		return empty;
	}
	const o = h as Record<string, unknown>;
	const title = typeof o.title === 'string' ? o.title.trim() : '';
	const subtitle = typeof o.subtitle === 'string' ? o.subtitle.trim() : '';
	const cover_image_url =
		typeof o.cover_image_url === 'string' ? o.cover_image_url.trim() : '';
	const overlay_image_url =
		typeof o.overlay_image_url === 'string' ? o.overlay_image_url.trim() : '';
	const alignRaw = o.overlay_image_align;
	const overlay_image_align =
		alignRaw === 'left' || alignRaw === 'right' || alignRaw === 'center'
			? alignRaw
			: 'center';
	return {
		title,
		subtitle,
		cover_image_url,
		overlay_image_url,
		overlay_image_align,
	};
}

export function toFrontendViewModel(
	raw: Record<string, unknown> | undefined
): FrontendViewModel {
	const base = toFormState( raw );
	const r = raw ?? {};
	return {
		...base,
		hero: pickHero( r ),
	};
}
