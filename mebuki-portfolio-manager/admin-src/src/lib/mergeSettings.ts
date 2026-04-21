import type {
	AboutItem,
	GalleryCategory,
	GalleryReviewItem,
	HeroConfig,
	HeroOverlayImageAlign,
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
	'hero',
	'about',
	'credo',
	'youtube_gallery',
	'illustration_gallery',
	'link_cards',
	'pricing',
	'faq',
	'reviews',
];

export const SECTION_LABELS: Record<SectionId, string> = {
	hero: 'ヒーロー',
	about: '自己紹介（About）',
	credo: 'クレド',
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

function pickCredo( raw: unknown ): { title: string; body: string } {
	if ( ! raw || typeof raw !== 'object' ) {
		return { title: '', body: '' };
	}
	const c = raw as Record<string, unknown>;
	return {
		title: typeof c.title === 'string' ? c.title : '',
		body: typeof c.body === 'string' ? c.body : '',
	};
}

function pickHeroOverlayAlign( raw: unknown ): HeroOverlayImageAlign {
	return raw === 'left' || raw === 'right' || raw === 'center' ? raw : 'center';
}

function pickHero( raw: unknown ): HeroConfig {
	if ( ! raw || typeof raw !== 'object' ) {
		return {
			title: '',
			subtitle: '',
			cover_image_url: '',
			overlay_image_url: '',
			overlay_image_align: 'center',
		};
	}
	const h = raw as Record<string, unknown>;
	return {
		title: typeof h.title === 'string' ? h.title : '',
		subtitle: typeof h.subtitle === 'string' ? h.subtitle : '',
		cover_image_url:
			typeof h.cover_image_url === 'string' ? h.cover_image_url : '',
		overlay_image_url:
			typeof h.overlay_image_url === 'string' ? h.overlay_image_url : '',
		overlay_image_align: pickHeroOverlayAlign( h.overlay_image_align ),
	};
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
				category_id?: unknown;
				hide_from_all?: unknown;
			};
			return {
				title: typeof o.title === 'string' ? o.title : '',
				url: typeof o.url === 'string' ? o.url : '',
				item_id: typeof o.item_id === 'string' ? o.item_id : '',
				category_id: typeof o.category_id === 'string' ? o.category_id : '',
				hide_from_all: Boolean( o.hide_from_all ),
			};
		}
		return {
			title: '',
			url: '',
			item_id: '',
			category_id: '',
			hide_from_all: false,
		};
	} );
}

function pickGalleryCategories( raw: unknown ): GalleryCategory[] {
	if ( ! raw || typeof raw !== 'object' ) {
		return [];
	}
	const categories = ( raw as { categories?: unknown } ).categories;
	if ( ! Array.isArray( categories ) ) {
		return [];
	}
	return categories
		.map( ( row ) => {
			if ( ! row || typeof row !== 'object' ) {
				return null;
			}
			const o = row as { id?: unknown; title?: unknown };
			const id = typeof o.id === 'string' ? o.id.trim() : '';
			const title = typeof o.title === 'string' ? o.title : '';
			if ( id === '' ) {
				return null;
			}
			return { id, title };
		} )
		.filter( ( row ): row is GalleryCategory => row !== null )
		.slice( 0, 4 );
}

function pickGalleryDisplayMode( raw: unknown ): 'tab' | 'category_sections' {
	if ( ! raw || typeof raw !== 'object' ) {
		return 'tab';
	}
	const mode = ( raw as { display_mode?: unknown } ).display_mode;
	return mode === 'category_sections' ? 'category_sections' : 'tab';
}

function pickGalleryItemsPerPage( raw: unknown ): number {
	if ( ! raw || typeof raw !== 'object' ) {
		return 10;
	}
	const n = Number( ( raw as { items_per_page?: unknown } ).items_per_page );
	if ( ! Number.isFinite( n ) ) {
		return 10;
	}
	const rounded = Math.trunc( n );
	if ( rounded < 1 ) {
		return 1;
	}
	if ( rounded > 50 ) {
		return 50;
	}
	return rounded;
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
		hero: pickHero( r.hero ),
		about: { items: pickAboutItems( r.about ) },
		credo: pickCredo( r.credo ),
		youtube_gallery: {
			display_mode: pickGalleryDisplayMode( r.youtube_gallery ),
			items_per_page: pickGalleryItemsPerPage( r.youtube_gallery ),
			categories: pickGalleryCategories( r.youtube_gallery ),
			items: pickGalleryLineItems( r.youtube_gallery ),
		},
		illustration_gallery: {
			display_mode: pickGalleryDisplayMode( r.illustration_gallery ),
			items_per_page: pickGalleryItemsPerPage( r.illustration_gallery ),
			categories: pickGalleryCategories( r.illustration_gallery ),
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
		portfolio_site_url:
			typeof r.portfolio_site_url === 'string' ? r.portfolio_site_url : '',
		review_fallback_icon_url:
			typeof r.review_fallback_icon_url === 'string'
				? r.review_fallback_icon_url
				: '',
		show_reviews_under_items: Boolean( r.show_reviews_under_items ),
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
		hero: {
			title: form.hero.title,
			subtitle: form.hero.subtitle,
			cover_image_url: form.hero.cover_image_url,
			overlay_image_url: form.hero.overlay_image_url,
			overlay_image_align: form.hero.overlay_image_align,
		},
		about: {
			items: form.about.items.map( ( row ) => ( {
				title: row.title,
				content: row.content,
			} ) ),
		},
		credo: form.credo,
		youtube_gallery: {
			display_mode: form.youtube_gallery.display_mode,
			items_per_page: form.youtube_gallery.items_per_page,
			categories: form.youtube_gallery.categories
				.slice( 0, 4 )
				.map( ( row ) => ( {
					id: row.id,
					title: row.title,
				} ) ),
			items: form.youtube_gallery.items.map( ( row ) => ( {
				title: row.title,
				url: row.url,
				item_id:
					row.item_id.trim() !== '' ? row.item_id : newLocalId(),
				category_id: row.category_id,
				hide_from_all: row.hide_from_all,
			} ) ),
		},
		illustration_gallery: {
			display_mode: form.illustration_gallery.display_mode,
			items_per_page: form.illustration_gallery.items_per_page,
			categories: form.illustration_gallery.categories
				.slice( 0, 4 )
				.map( ( row ) => ( {
					id: row.id,
					title: row.title,
				} ) ),
			items: form.illustration_gallery.items.map( ( row ) => ( {
				title: row.title,
				url: row.url,
				item_id:
					row.item_id.trim() !== '' ? row.item_id : newLocalId(),
				category_id: row.category_id,
				hide_from_all: row.hide_from_all,
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
		portfolio_site_url: form.portfolio_site_url,
		review_fallback_icon_url: form.review_fallback_icon_url,
		show_reviews_under_items: form.show_reviews_under_items,
	};

	if ( form.api_key !== undefined ) {
		payload.api_key = form.api_key;
	}
	if ( form.endpoint !== undefined ) {
		payload.endpoint = form.endpoint;
	}

	return payload;
}
