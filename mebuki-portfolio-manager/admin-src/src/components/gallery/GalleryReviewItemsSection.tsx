import type { Dispatch, SetStateAction } from 'react';
import type { GalleryReviewItem, MebukiFormState } from '../../types/settings';
import type { ToastVariant } from '../Toast';
import { ReviewUrlCopyButton } from './ReviewUrlCopyButton';

export type GallerySectionKey = 'youtube_gallery' | 'illustration_gallery';

type ReviewTarget = 'youtube' | 'illustration';

const CONFIG: Record<
	GallerySectionKey,
	{
		itemType: ReviewTarget;
		rowLabel: string;
		urlLabel: string;
		urlPlaceholder: string;
		emptyHint: string;
		addLabel: string;
	}
> = {
	youtube_gallery: {
		itemType: 'youtube',
		rowLabel: '動画',
		urlLabel: 'URL',
		urlPlaceholder: 'https://www.youtube.com/watch?v=...',
		emptyHint: '動画がまだありません。追加してください。',
		addLabel: '＋ 動画を追加',
	},
	illustration_gallery: {
		itemType: 'illustration',
		rowLabel: 'イラスト',
		urlLabel: '画像またはページ URL',
		urlPlaceholder: 'https://...',
		emptyHint: 'イラストがまだありません。追加してください。',
		addLabel: '＋ イラストを追加',
	},
};

type Props = {
	galleryKey: GallerySectionKey;
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
	onNotify: ( message: string, variant: ToastVariant ) => void;
};

export function GalleryReviewItemsSection( {
	galleryKey,
	form,
	setForm,
	onNotify,
}: Props ) {
	const cfg = CONFIG[ galleryKey ];
	const items = form[ galleryKey ].items;
	const siteUrl = window.mebukiPmRest?.siteUrl;

	const updateRow = (
		index: number,
		patch: Partial<GalleryReviewItem>
	) => {
		setForm( ( f ) => {
			const slice = f[ galleryKey ];
			const next = [ ...slice.items ];
			next[ index ] = { ...next[ index ], ...patch };
			return { ...f, [ galleryKey ]: { items: next } };
		} );
	};

	const addRow = () => {
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				items: [
					...f[ galleryKey ].items,
					{ title: '', url: '', item_id: '' },
				],
			},
		} ) );
	};

	const removeRow = ( index: number ) => {
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				items: f[ galleryKey ].items.filter( ( _, i ) => i !== index ),
			},
		} ) );
	};

	return (
		<div className="space-y-3">
			{ items.length === 0 ? (
				<p className="text-sm text-slate-500">{ cfg.emptyHint }</p>
			) : null }
			{ items.map( ( row, index ) => (
				<div
					key={ `${ galleryKey }-${ index }-${ row.item_id || 'new' }` }
					className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
				>
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<span className="text-xs font-medium text-slate-500">
							{ cfg.rowLabel } { index + 1 }
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<ReviewUrlCopyButton
								siteUrl={ siteUrl }
								itemType={ cfg.itemType }
								itemId={ row.item_id }
								onNotify={ onNotify }
							/>
							<button
								type="button"
								className="text-xs text-rose-600 hover:text-rose-800"
								onClick={ () => removeRow( index ) }
							>
								削除
							</button>
						</div>
					</div>
					<div className="grid gap-2 sm:grid-cols-2">
						<div>
							<label className="mb-1 block text-xs text-slate-600">
								タイトル
							</label>
							<input
								type="text"
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.title }
								onChange={ ( e ) =>
									updateRow( index, { title: e.target.value } )
								}
								placeholder="表示名"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs text-slate-600">
								{ cfg.urlLabel }
							</label>
							<input
								type="url"
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.url }
								onChange={ ( e ) =>
									updateRow( index, { url: e.target.value } )
								}
								placeholder={ cfg.urlPlaceholder }
							/>
						</div>
					</div>
					{ row.item_id.trim() !== '' ? (
						<p className="mt-2 font-mono text-[10px] text-slate-400">
							item_id: { row.item_id }
						</p>
					) : (
						<p className="mt-2 text-[10px] text-amber-700/90">
							口コミ用 ID は「保存」後に発行されます。
						</p>
					) }
				</div>
			) ) }
			<button
				type="button"
				className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
				onClick={ addRow }
			>
				{ cfg.addLabel }
			</button>
		</div>
	);
}
