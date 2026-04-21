import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildPayloadForApi, toFormState } from '../../lib/mergeSettings';
import { fetchSettingsMe, saveSettingsMe } from '../../lib/settingsApi';
import type { MebukiFormState, SectionId } from '../../types/settings';
import { Toast, type ToastVariant } from '../Toast';
import { IllustrationGallery } from '../gallery/IllustrationGallery';
import { YouTubeGallery } from '../gallery/YouTubeGallery';
import { AboutRepeater } from './AboutRepeater';
import { BasicSettingsCard } from './BasicSettingsCard';
import { ReviewsSection } from './ReviewsSection';
import {
	CredoSectionEditor,
	FaqSection,
	HeroSectionEditor,
	LinkCardsSection,
	PricingSection,
} from './SectionEditors';

type SettingsTabId = 'basic' | SectionId;

const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
	{ id: 'basic', label: '基本設定' },
	{ id: 'hero', label: 'ヒーローセクション' },
	{ id: 'about', label: '自己紹介' },
	{ id: 'credo', label: 'クレド' },
	{ id: 'youtube_gallery', label: 'YouTubeギャラリー' },
	{ id: 'illustration_gallery', label: 'イラストギャラリー' },
	{ id: 'link_cards', label: 'リンクカード' },
	{ id: 'reviews', label: '口コミ' },
	{ id: 'pricing', label: '料金表' },
	{ id: 'faq', label: 'FAQ' },
];

function renderSectionBody(
	id: SectionId,
	form: MebukiFormState,
	setForm: Dispatch<SetStateAction<MebukiFormState>>,
	rest: { root: string; nonce: string },
	onNotify: ( message: string, variant: ToastVariant ) => void
) {
	switch ( id ) {
		case 'hero':
			return <HeroSectionEditor form={ form } setForm={ setForm } />;
		case 'about':
			return <AboutRepeater form={ form } setForm={ setForm } />;
		case 'youtube_gallery':
			return (
				<YouTubeGallery
					form={ form }
					setForm={ setForm }
					onNotify={ onNotify }
				/>
			);
		case 'illustration_gallery':
			return (
				<IllustrationGallery
					form={ form }
					setForm={ setForm }
					onNotify={ onNotify }
				/>
			);
		case 'link_cards':
			return <LinkCardsSection form={ form } setForm={ setForm } />;
		case 'credo':
			return <CredoSectionEditor form={ form } setForm={ setForm } />;
		case 'pricing':
			return <PricingSection form={ form } setForm={ setForm } />;
		case 'faq':
			return <FaqSection form={ form } setForm={ setForm } />;
		case 'reviews':
			return (
				<ReviewsSection
					root={ rest.root }
					nonce={ rest.nonce }
					form={ form }
					setForm={ setForm }
					onNotify={ onNotify }
				/>
			);
		default:
			return null;
	}
}

export function SettingsEditor() {
	const rest = window.mebukiPmRest;

	const [ form, setForm ] = useState<MebukiFormState>( () =>
		toFormState( undefined )
	);
	const [ loading, setLoading ] = useState( true );
	const [ loadError, setLoadError ] = useState<string | null>( null );
	const [ saving, setSaving ] = useState( false );
	const [ activeTab, setActiveTab ] = useState<SettingsTabId>( 'basic' );
	const [ updatedAt, setUpdatedAt ] = useState<string | null>( null );

	const [ toast, setToast ] = useState<{
		message: string;
		variant: ToastVariant;
	} | null >( null );

	const notify = useCallback( ( message: string, variant: ToastVariant ) => {
		setToast( { message, variant } );
	}, [] );

	const load = useCallback( async () => {
		if ( ! rest?.root || ! rest.nonce ) {
			setLoadError(
				'REST 設定（mebukiPmRest）が見つかりません。ページを再読み込みしてください。'
			);
			setLoading( false );
			return;
		}
		setLoading( true );
		setLoadError( null );
		try {
			const data = await fetchSettingsMe( rest.root, rest.nonce );
			const raw =
				data.settings && typeof data.settings === 'object'
					? ( data.settings as Record<string, unknown> )
					: {};
			setForm( toFormState( raw ) );
			setUpdatedAt( data.updated_at );
		} catch ( e ) {
			setLoadError(
				e instanceof Error ? e.message : '設定の読み込みに失敗しました。'
			);
		} finally {
			setLoading( false );
		}
	}, [ rest?.nonce, rest?.root ] );

	useEffect( () => {
		void load();
	}, [ load ] );

	const onSave = async () => {
		if ( ! rest?.root || ! rest.nonce || saving ) {
			return;
		}
		setSaving( true );
		try {
			await saveSettingsMe(
				rest.root,
				rest.nonce,
				buildPayloadForApi( form )
			);
			setToast( { message: '保存しました。', variant: 'success' } );
			const fresh = await fetchSettingsMe( rest.root, rest.nonce );
			const raw =
				fresh.settings && typeof fresh.settings === 'object'
					? ( fresh.settings as Record<string, unknown> )
					: {};
			setForm( toFormState( raw ) );
			setUpdatedAt( fresh.updated_at );
		} catch ( e ) {
			setToast( {
				message:
					e instanceof Error
						? e.message
						: '保存に失敗しました。',
				variant: 'error',
			} );
		} finally {
			setSaving( false );
		}
	};

	const updatedLabel = useMemo( () => {
		if ( ! updatedAt ) {
			return null;
		}
		const d = new Date( updatedAt );
		if ( Number.isNaN( d.getTime() ) ) {
			return updatedAt;
		}
		return d.toLocaleString( 'ja-JP' );
	}, [ updatedAt ] );

	if ( ! rest?.root || ! rest.nonce ) {
		return (
			<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
				管理画面の初期化データが不足しています。プラグインの読み込みを確認してください。
			</div>
		);
	}

	if ( loading ) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
				設定を読み込み中です…
			</div>
		);
	}

	if ( loadError ) {
		return (
			<div className="space-y-3">
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
					{ loadError }
				</div>
				<button
					type="button"
					className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
					onClick={ () => void load() }
				>
					再試行
				</button>
			</div>
		);
	}

	const restCtx = { root: rest.root, nonce: rest.nonce };
	const activeTabLabel =
		SETTINGS_TABS.find( ( tab ) => tab.id === activeTab )?.label ?? '基本設定';

	return (
		<div className="relative pb-24">
			{ toast ? (
				<Toast
					message={ toast.message }
					variant={ toast.variant }
					onDismiss={ () => setToast( null ) }
				/>
			) : null }

			<div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-xl font-semibold text-slate-900">
						サイト表示マスター
					</h1>
					<p className="mt-1 text-sm text-slate-600">
						左タブで設定カテゴリを切り替えて編集できます。
					</p>
				</div>
				{ updatedLabel ? (
					<p className="text-xs text-slate-500">最終更新: { updatedLabel }</p>
				) : (
					<p className="text-xs text-slate-500">未保存の新規状態</p>
				) }
			</div>

			<div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
				<aside className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-900/5">
					<nav aria-label="サイト設定カテゴリ" className="space-y-1">
						{ SETTINGS_TABS.map( ( tab ) => {
							const active = tab.id === activeTab;
							return (
								<button
									key={ tab.id }
									type="button"
									className={ `w-full rounded-lg px-3 py-2 text-left text-sm transition ${
										active
											? 'bg-sky-50 font-medium text-sky-900 ring-1 ring-sky-200'
											: 'text-slate-700 hover:bg-slate-50'
									}` }
									onClick={ () => setActiveTab( tab.id ) }
								>
									{ tab.label }
								</button>
							);
						} ) }
					</nav>
				</aside>
				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
					<h2 className="text-base font-semibold text-slate-900">
						{ activeTabLabel }
					</h2>
					<div className="mt-4">
						{ activeTab === 'basic' ? (
							<BasicSettingsCard form={ form } setForm={ setForm } />
						) : (
							renderSectionBody( activeTab, form, setForm, restCtx, notify )
						) }
					</div>
				</section>
			</div>

			<div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
				<button
					type="button"
					className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
					onClick={ () => void onSave() }
					disabled={ saving }
				>
					{ saving ? (
						<span className="inline-flex items-center gap-2">
							<span
								className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								aria-hidden
							/>
							保存中…
						</span>
					) : (
						'保存'
					) }
				</button>
			</div>
		</div>
	);
}
