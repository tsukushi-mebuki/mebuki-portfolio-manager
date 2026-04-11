import type {
	AboutItem,
	GalleryReviewItem,
	LinkCardItem,
	MebukiFormState,
	PricingCategory,
	PricingCourse,
	PricingOption,
	SectionId,
} from '../types/settings';
import {
	normalizeThemePreset,
	resolveThemeFromRaw,
	THEME_PRESETS,
} from './themePresets';
import type { ThemePresetId } from './themePresets';

export const ALL_SECTIONS: SectionId[] = [
	'about',
	'youtube_gallery',
	'illustration_gallery',
	'link_cards',
	'pricing',
	'faq',
	'reviews',
];

export const SECTION_LABELS: Record<SectionId, string> = {
	about: '自己紹介（About）',
	youtube_gallery: 'YouTubeギャラリー',
	illustration_gallery: 'イラストギャラリー',
	link_cards: 'リンクカード',
	pricing: '料金表',
	faq: 'FAQ',
	reviews: '口コミ',
};

export function newLocalId(): string {
	if ( typeof crypto !== 'undefined' && crypto.randomUUID ) {
		return crypto.randomUUID();
	}
	return `id-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 9 ) }`;
}

export function normalizeLayoutOrder( order: unknown ): SectionId[] {
	if ( ! Array.isArray( order ) ) {
		return [ ...ALL_SECTIONS ];
	}
	const seen = new Set<SectionId>();
	const out: SectionId[] = [];
	for ( const x of order ) {
		if (
			typeof x === 'string' &&
			ALL_SECTIONS.includes( x as SectionId ) &&
			! seen.has( x as SectionId )
		) {
			const id = x as SectionId;
			seen.add( id );
			out.push( id );
		}
	}
	for ( const id of ALL_SECTIONS ) {
		if ( ! seen.has( id ) ) {
			out.push( id );
		}
	}
	return out;
}

function pickAboutItems( raw: unknown ): AboutItem[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const o = raw as Record<string, unknown>;

	if ( Array.isArray( o.items ) ) {
		return o.items.map( ( row ) => {
			if ( row && typeof row === 'object' ) {
				const r = row as {
					id?: unknown;
					title?: unknown;
					content?: unknown;
				};
				return {
					id: typeof r.id === 'string' ? r.id : newLocalId(),
					title: typeof r.title === 'string' ? r.title : '',
					content: typeof r.content === 'string' ? r.content : '',
				};
			}
			return { id: newLocalId(), title: '', content: '' };
		} );
	}

	if ( typeof o.body === 'string' && o.body.trim() !== '' ) {
		return [
			{
				id: newLocalId(),
				title: '概要',
				content: o.body,
			},
		];
	}

	return [];
}

function pickGalleryLineItems( raw: unknown ): GalleryReviewItem[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const items = ( raw as { items?: unknown } ).items;
	if ( ! Array.isArray( items ) ) {
		return [];
	}
	return items.map( ( row ) => {
		if ( row && typeof row === 'object' ) {
			const o = row as {
				title?: unknown;
				url?: unknown;
				item_id?: unknown;
			};
			return {
				title: typeof o.title === 'string' ? o.title : '',
				url: typeof o.url === 'string' ? o.url : '',
				item_id: typeof o.item_id === 'string' ? o.item_id : '',
			};
		}
		return { title: '', url: '', item_id: '' };
	} );
}

function pickLinkCardItems( raw: unknown ): LinkCardItem[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const items = ( raw as { items?: unknown } ).items;
	if ( ! Array.isArray( items ) ) {
		return [];
	}
	return items.map( ( row ) => {
		if ( row && typeof row === 'object' ) {
			const o = row as {
				id?: unknown;
				title?: unknown;
				url?: unknown;
				thumbnail_url?: unknown;
			};
			return {
				id: typeof o.id === 'string' ? o.id : newLocalId(),
				title: typeof o.title === 'string' ? o.title : '',
				url: typeof o.url === 'string' ? o.url : '',
				thumbnail_url:
					typeof o.thumbnail_url === 'string' ? o.thumbnail_url : '',
			};
		}
		return {
			id: newLocalId(),
			title: '',
			url: '',
			thumbnail_url: '',
		};
	} );
}

function normalizePricingCourse( raw: unknown ): PricingCourse {
	if ( ! raw || typeof raw !== 'object' ) {
		return {
			id: newLocalId(),
			name: '',
			description: '',
			amount: '',
		};
	}
	const o = raw as Record<string, unknown>;
	return {
		id: typeof o.id === 'string' ? o.id : newLocalId(),
		name: typeof o.name === 'string' ? o.name : '',
		description: typeof o.description === 'string' ? o.description : '',
		amount: typeof o.amount === 'string' ? o.amount : '',
	};
}

function normalizePricingOption( raw: unknown ): PricingOption {
	if ( ! raw || typeof raw !== 'object' ) {
		return {
			id: newLocalId(),
			name: '',
			description: '',
			amount: '',
		};
	}
	const o = raw as Record<string, unknown>;
	return {
		id: typeof o.id === 'string' ? o.id : newLocalId(),
		name: typeof o.name === 'string' ? o.name : '',
		description: typeof o.description === 'string' ? o.description : '',
		amount: typeof o.amount === 'string' ? o.amount : '',
	};
}

function normalizePricingCategory( raw: unknown ): PricingCategory {
	if ( ! raw || typeof raw !== 'object' ) {
		return {
			id: newLocalId(),
			name: '',
			courses: [],
			options: [],
		};
	}
	const o = raw as Record<string, unknown>;
	const courses = Array.isArray( o.courses )
		? o.courses.map( ( c ) => normalizePricingCourse( c ) )
		: [];
	const options = Array.isArray( o.options )
		? o.options.map( ( x ) => normalizePricingOption( x ) )
		: [];
	return {
		id: typeof o.id === 'string' ? o.id : newLocalId(),
		name: typeof o.name === 'string' ? o.name : '',
		courses,
		options,
	};
}

function pickFlatLegacyPricingItems( raw: unknown ): {
	name: string;
	description: string;
	amount: string;
}[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const items = ( raw as { items?: unknown } ).items;
	if ( ! Array.isArray( items ) ) {
		return [];
	}
	return items.map( ( row ) => {
		if ( row && typeof row === 'object' ) {
			const o = row as {
				name?: unknown;
				description?: unknown;
				amount?: unknown;
			};
			return {
				name: typeof o.name === 'string' ? o.name : '',
				description: typeof o.description === 'string' ? o.description : '',
				amount: typeof o.amount === 'string' ? o.amount : '',
			};
		}
		return { name: '', description: '', amount: '' };
	} );
}

/**
 * Hierarchical pricing, with migration from legacy flat `pricing.items`.
 */
function pickPricing( raw: unknown ): { categories: PricingCategory[] } {
	if ( ! raw || typeof raw !== 'object' ) {
		return { categories: [] };
	}
	const p = raw as Record<string, unknown>;

	if ( Array.isArray( p.categories ) ) {
		return {
			categories: p.categories.map( ( c ) => normalizePricingCategory( c ) ),
		};
	}

	/** Legacy: flat rows → single category「基本カテゴリ」with each row as a course. */
	const legacy = pickFlatLegacyPricingItems( raw );
	if ( legacy.length === 0 ) {
		return { categories: [] };
	}
	return {
		categories: [
			{
				id: newLocalId(),
				name: '基本カテゴリ',
				courses: legacy.map( ( row ) => ( {
					id: newLocalId(),
					name: row.name,
					description: row.description,
					amount: row.amount,
				} ) ),
				options: [],
			},
		],
	};
}

function pickFaqItems( raw: unknown ): { question: string; answer: string }[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const items = ( raw as { items?: unknown } ).items;
	if ( ! Array.isArray( items ) ) {
		return [];
	}
	return items.map( ( row ) => {
		if ( row && typeof row === 'object' ) {
			const o = row as { question?: unknown; answer?: unknown };
			return {
				question: typeof o.question === 'string' ? o.question : '',
				answer: typeof o.answer === 'string' ? o.answer : '',
			};
		}
		return { question: '', answer: '' };
	} );
}

/**
 * Maps API `settings` object (decoded JSON) into controlled form state.
 */
export function toFormState( raw: Record<string, unknown> | undefined ): MebukiFormState {
	const r = raw ?? {};
	const theme_preset = normalizeThemePreset( r.theme_preset );
	const theme = resolveThemeFromRaw( r.theme, theme_preset );

	return {
		layout_order: normalizeLayoutOrder( r.layout_order ),
		theme_preset,
		theme,
		about: { items: pickAboutItems( r.about ) },
		youtube_gallery: { items: pickGalleryLineItems( r.youtube_gallery ) },
		illustration_gallery: {
			items: pickGalleryLineItems( r.illustration_gallery ),
		},
		link_cards: { items: pickLinkCardItems( r.link_cards ) },
		pricing: pickPricing( r.pricing ),
		faq: { items: pickFaqItems( r.faq ) },
		stripe_public_key:
			typeof r.stripe_public_key === 'string' ? r.stripe_public_key : '',
		stripe_secret_key:
			typeof r.stripe_secret_key === 'string' ? r.stripe_secret_key : '',
		stripe_webhook_secret:
			typeof r.stripe_webhook_secret === 'string'
				? r.stripe_webhook_secret
				: '',
		admin_email: typeof r.admin_email === 'string' ? r.admin_email : '',
		api_key: typeof r.api_key === 'string' ? r.api_key : undefined,
		endpoint: typeof r.endpoint === 'string' ? r.endpoint : undefined,
	};
}

/**
 * Payload for POST /settings/me — merges resolved `theme` from preset and strips editor-only ids.
 */
export function buildPayloadForApi( form: MebukiFormState ): Record<string, unknown> {
	const preset: ThemePresetId = form.theme_preset;
	const theme = { ...THEME_PRESETS[ preset ] };

	const payload: Record<string, unknown> = {
		layout_order: form.layout_order,
		theme_preset: preset,
		theme,
		about: {
			items: form.about.items.map( ( row ) => ( {
				title: row.title,
				content: row.content,
			} ) ),
		},
		youtube_gallery: {
			items: form.youtube_gallery.items.map( ( row ) => ( {
				title: row.title,
				url: row.url,
				item_id:
					row.item_id.trim() !== '' ? row.item_id : newLocalId(),
			} ) ),
		},
		illustration_gallery: {
			items: form.illustration_gallery.items.map( ( row ) => ( {
				title: row.title,
				url: row.url,
				item_id:
					row.item_id.trim() !== '' ? row.item_id : newLocalId(),
			} ) ),
		},
		link_cards: {
			items: form.link_cards.items.map( ( row ) => ( {
				title: row.title,
				url: row.url,
				thumbnail_url: row.thumbnail_url,
			} ) ),
		},
		pricing: form.pricing,
		faq: form.faq,
		stripe_public_key: form.stripe_public_key,
		stripe_secret_key: form.stripe_secret_key,
		stripe_webhook_secret: form.stripe_webhook_secret,
		admin_email: form.admin_email,
	};

	if ( form.api_key !== undefined ) {
		payload.api_key = form.api_key;
	}
	if ( form.endpoint !== undefined ) {
		payload.endpoint = form.endpoint;
	}

	return payload;
}
