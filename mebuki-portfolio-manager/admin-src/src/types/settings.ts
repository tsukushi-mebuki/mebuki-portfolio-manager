import type { ThemePresetId, ThemeTokens } from '../lib/themePresets';

export type SectionId =
	| 'about'
	| 'youtube_gallery'
	| 'illustration_gallery'
	| 'link_cards'
	| 'pricing'
	| 'faq'
	| 'reviews';

/** YouTube / イラストギャラリー共通の1行（口コミ用 item_id） */
export interface GalleryReviewItem {
	title: string;
	url: string;
	/** 空のときは未保存行。保存後に JSON へ永続化される。 */
	item_id: string;
}

/** Editor-only stable id for DnD keys (not persisted). */
export interface AboutItem {
	id: string;
	title: string;
	content: string;
}

export interface LinkCardItem {
	id: string;
	title: string;
	url: string;
	thumbnail_url: string;
}

/** 料金シミュレーター: コース（単一選択・ベース価格） */
export interface PricingCourse {
	id: string;
	name: string;
	description: string;
	/** 表示用テキスト（計算は数字部分を抽出） */
	amount: string;
}

/** 料金シミュレーター: オプション（複数選択・加算） */
export interface PricingOption {
	id: string;
	name: string;
	description: string;
	amount: string;
}

/** 料金シミュレーター: カテゴリ（タブ） */
export interface PricingCategory {
	id: string;
	name: string;
	courses: PricingCourse[];
	options: PricingOption[];
}

export interface MebukiFormState {
	layout_order: SectionId[];
	theme_preset: ThemePresetId;
	theme: ThemeTokens;
	about: { items: AboutItem[] };
	youtube_gallery: { items: GalleryReviewItem[] };
	illustration_gallery: { items: GalleryReviewItem[] };
	link_cards: { items: LinkCardItem[] };
	pricing: { categories: PricingCategory[] };
	faq: { items: { question: string; answer: string }[] };
	stripe_public_key: string;
	stripe_secret_key: string;
	/** Stripe Webhook 署名検証用（whsec_...） */
	stripe_webhook_secret: string;
	admin_email: string;
	api_key?: string;
	endpoint?: string;
}

export interface SettingsMeResponse {
	settings: Record<string, unknown>;
	updated_at: string | null;
}

export interface ReviewRow {
	id: number;
	user_id: number;
	item_type: string;
	item_id: string;
	reviewer_name: string;
	reviewer_thumbnail_url: string;
	review_text: string;
	status: string;
	created_at: string | null;
	updated_at: string | null;
}
