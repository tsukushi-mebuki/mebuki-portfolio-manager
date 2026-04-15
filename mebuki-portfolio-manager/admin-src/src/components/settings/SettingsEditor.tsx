import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildPayloadForApi, SECTION_LABELS, toFormState } from '../../lib/mergeSettings';
import { fetchSettingsMe, saveSettingsMe } from '../../lib/settingsApi';
import type { MebukiFormState, SectionId } from '../../types/settings';
import { Toast, type ToastVariant } from '../Toast';
import { IllustrationGallery } from '../gallery/IllustrationGallery';
import { YouTubeGallery } from '../gallery/YouTubeGallery';
import { AboutRepeater } from './AboutRepeater';
import { BasicSettingsCard } from './BasicSettingsCard';
import { ReviewsSection } from './ReviewsSection';
import { SortableSectionCard } from './SortableSectionCard';
import {
	CredoSectionEditor,
	FaqSection,
	LinkCardsSection,
	PricingSection,
} from './SectionEditors';

function renderSectionBody(
	id: SectionId,
	form: MebukiFormState,
	setForm: Dispatch<SetStateAction<MebukiFormState>>,
	rest: { root: string; nonce: string },
	onNotify: ( message: string, variant: ToastVariant ) => void
) {
	switch ( id ) {
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
	const [ updatedAt, setUpdatedAt ] = useState<string | null>( null );

	const [ toast, setToast ] = useState<{
		message: string;
		variant: ToastVariant;
	} | null >( null );

	const notify = useCallback( ( message: string, variant: ToastVariant ) => {
		setToast( { message, variant } );
	}, [] );

	const sensors = useSensors(
		useSensor( PointerSensor, {
			activationConstraint: { distance: 8 },
		} ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

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

	const onDragEnd = ( event: DragEndEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		setForm( ( prev ) => {
			const oldIndex = prev.layout_order.indexOf( active.id as SectionId );
			const newIndex = prev.layout_order.indexOf( over.id as SectionId );
			if ( oldIndex === -1 || newIndex === -1 ) {
				return prev;
			}
			return {
				...prev,
				layout_order: arrayMove( prev.layout_order, oldIndex, newIndex ),
			};
		} );
	};

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
						基本設定は上部に固定。以下のカードは表示順（
						<code className="rounded bg-slate-100 px-1 text-xs">
							layout_order
						</code>
						）を DnD で変更できます。
					</p>
				</div>
				{ updatedLabel ? (
					<p className="text-xs text-slate-500">最終更新: { updatedLabel }</p>
				) : (
					<p className="text-xs text-slate-500">未保存の新規状態</p>
				) }
			</div>

			<BasicSettingsCard form={ form } setForm={ setForm } />

			<p className="mb-4 text-sm text-slate-600">
				左の <span className="font-mono">⋮⋮</span> ハンドルでセクション全体の順序を変更します（口コミブロックの位置もここで制御）。
			</p>

			<DndContext
				sensors={ sensors }
				collisionDetection={ closestCenter }
				onDragEnd={ onDragEnd }
			>
				<SortableContext
					items={ form.layout_order }
					strategy={ verticalListSortingStrategy }
				>
					{ form.layout_order.map( ( id ) => (
						<SortableSectionCard
							key={ id }
							id={ id }
							title={ SECTION_LABELS[ id ] }
						>
							{ renderSectionBody(
								id,
								form,
								setForm,
								restCtx,
								notify
							) }
						</SortableSectionCard>
					) ) }
				</SortableContext>
			</DndContext>

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
