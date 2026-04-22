import type { ThemePresetId, ThemeTokens } from '../lib/themePresets';

export type SectionId =
	| 'about'
	| 'credo'
	| 'youtube_gallery'
	| 'illustration_gallery'
	| 'link_cards'
	| 'pricing'
	| 'faq'
	| 'reviews';

export interface CredoConfig {
	title: string;
	body: string;
}

/** YouTube / イラストギャラリー共通の1行（口コミ用 item_id） */
export interface GalleryReviewItem {
	title: string;
	url: string;
	/** 空のときは未保存行。保存後に JSON へ永続化される。 */
	item_id: string;
	/** 空文字は未分類。 */
	category_id: string;
	/** true の場合、ALL タブでは非表示（カテゴリタブ内のみ表示）。 */
	hide_from_all: boolean;
}

export interface GalleryCategory {
	id: string;
	title: string;
}

export type GalleryDisplayMode = 'tab' | 'category_sections';

export interface GalleryConfig {
	display_mode: GalleryDisplayMode;
	items_per_page: number;
	categories: GalleryCategory[];
	items: GalleryReviewItem[];
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
	credo: CredoConfig;
	youtube_gallery: GalleryConfig;
	illustration_gallery: GalleryConfig;
	link_cards: { items: LinkCardItem[] };
	pricing: { categories: PricingCategory[] };
	faq: { items: { question: string; answer: string }[] };
	stripe_public_key: string;
	stripe_secret_key: string;
	/** Stripe Webhook 署名検証用（whsec_...） */
	stripe_webhook_secret: string;
	admin_email: string;
	/** 口コミ投稿完了画面の戻り先URL（未設定時はサイトURLにフォールバック） */
	portfolio_site_url: string;
	/** 口コミアイコン未設定時のフォールバック画像URL */
	review_fallback_icon_url: string;
	/** YouTube/Illustration 作品カード下に口コミを表示するか */
	show_reviews_under_items: boolean;
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
	sort_order: number;
	created_at: string | null;
	updated_at: string | null;
}
