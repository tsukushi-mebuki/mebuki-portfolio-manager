import type { Dispatch, SetStateAction } from 'react';
import type { GalleryReviewItem, MebukiFormState } from '../../types/settings';
import { newLocalId } from '../../lib/mergeSettings';
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
	const gallery = form[ galleryKey ];
	const items = gallery.items;
	const categories = gallery.categories;
	const siteUrl = window.mebukiPmRest?.siteUrl;
	const portfolioPath = window.mebukiPmRest?.portfolioPath;

	const updateRow = (
		index: number,
		patch: Partial<GalleryReviewItem>
	) => {
		setForm( ( f ) => {
			const slice = f[ galleryKey ];
			const next = [ ...slice.items ];
			next[ index ] = { ...next[ index ], ...patch };
			return { ...f, [ galleryKey ]: { ...slice, items: next } };
		} );
	};

	const addRow = () => {
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				...f[ galleryKey ],
				items: [
					...f[ galleryKey ].items,
					{
						title: '',
						url: '',
						item_id: '',
						category_id: '',
						hide_from_all: false,
					},
				],
			},
		} ) );
	};

	const removeRow = ( index: number ) => {
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				...f[ galleryKey ],
				items: f[ galleryKey ].items.filter( ( _, i ) => i !== index ),
			},
		} ) );
	};

	const addCategory = () => {
		if ( categories.length >= 4 ) {
			return;
		}
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				...f[ galleryKey ],
				categories: [
					...f[ galleryKey ].categories,
					{ id: newLocalId(), title: '' },
				],
			},
		} ) );
	};

	const updateCategoryTitle = ( index: number, title: string ) => {
		setForm( ( f ) => {
			const next = [ ...f[ galleryKey ].categories ];
			if ( ! next[ index ] ) {
				return f;
			}
			next[ index ] = { ...next[ index ], title };
			return {
				...f,
				[ galleryKey ]: { ...f[ galleryKey ], categories: next },
			};
		} );
	};

	const removeCategory = ( categoryId: string ) => {
		setForm( ( f ) => ( {
			...f,
			[ galleryKey ]: {
				...f[ galleryKey ],
				categories: f[ galleryKey ].categories.filter(
					( row ) => row.id !== categoryId
				),
				items: f[ galleryKey ].items.map( ( row ) =>
					row.category_id === categoryId ? { ...row, category_id: '' } : row
				),
			},
		} ) );
	};

	return (
		<div className="space-y-3">
			<div className="rounded-lg border border-slate-200 bg-white p-3">
				<p className="mb-2 text-xs font-medium text-slate-600">表示設定</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<div>
						<label className="mb-1 block text-xs text-slate-600">
							表示モード
						</label>
						<select
							className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ gallery.display_mode }
							onChange={ ( e ) =>
								setForm( ( f ) => ( {
									...f,
									[ galleryKey ]: {
										...f[ galleryKey ],
										display_mode:
											e.target.value === 'category_sections'
												? 'category_sections'
												: 'tab',
									},
								} ) )
							}
						>
							<option value="tab">タブ表示</option>
							<option value="category_sections">
								カテゴリごとの独立セクション（横スクロール）
							</option>
						</select>
						{ gallery.display_mode === 'category_sections' ? (
							<p className="mt-1 text-[11px] text-slate-500">
								ALL タブは非表示になり、カテゴリごとの帯状セクションで表示されます。
							</p>
						) : null }
					</div>
					<div>
						<label className="mb-1 block text-xs text-slate-600">
							1ページあたり件数
						</label>
						<input
							type="number"
							min={ 1 }
							max={ 50 }
							step={ 1 }
							className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ gallery.items_per_page }
							onChange={ ( e ) => {
								const n = Number( e.target.value );
								const next = Number.isFinite( n ) ? Math.trunc( n ) : 10;
								setForm( ( f ) => ( {
									...f,
									[ galleryKey ]: {
										...f[ galleryKey ],
										items_per_page:
											next < 1 ? 1 : next > 50 ? 50 : next,
									},
								} ) );
							} }
						/>
					</div>
				</div>
			</div>

			<div className="rounded-lg border border-slate-200 bg-white p-3">
				<div className="mb-2 flex items-center justify-between gap-2">
					<p className="text-xs font-medium text-slate-600">
						カテゴリ（最大4）
					</p>
					<button
						type="button"
						className="text-xs text-sky-700 hover:text-sky-900 disabled:opacity-50"
						onClick={ addCategory }
						disabled={ categories.length >= 4 }
					>
						＋ カテゴリ追加
					</button>
				</div>
				<div className="space-y-2">
					{ categories.length === 0 ? (
						<p className="text-xs text-slate-500">
							カテゴリ未設定
						</p>
					) : null }
					{ categories.map( ( category, index ) => (
						<div key={ category.id } className="flex items-center gap-2">
							<input
								type="text"
								value={ category.title }
								onChange={ ( e ) =>
									updateCategoryTitle( index, e.target.value )
								}
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								placeholder={ `カテゴリ ${ index + 1 }` }
							/>
							<button
								type="button"
								className="text-xs text-rose-600 hover:text-rose-800"
								onClick={ () => removeCategory( category.id ) }
							>
								削除
							</button>
						</div>
					) ) }
				</div>
			</div>

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
								portfolioPath={ portfolioPath }
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
					<div className="grid gap-2 sm:grid-cols-3">
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
						<div>
							<label className="mb-1 block text-xs text-slate-600">
								カテゴリ
							</label>
							<select
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.category_id }
								onChange={ ( e ) =>
									updateRow( index, { category_id: e.target.value } )
								}
							>
								<option value="">未分類（ALL）</option>
								{ categories.map( ( category ) => (
									<option key={ category.id } value={ category.id }>
										{ category.title.trim() || '(無題カテゴリ)' }
									</option>
								) ) }
							</select>
						</div>
					</div>
					<label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
						<input
							type="checkbox"
							checked={ row.hide_from_all }
							onChange={ ( e ) =>
								updateRow( index, { hide_from_all: e.target.checked } )
							}
						/>
						ALL には非表示（カテゴリタブ内のみ表示）
					</label>
					{ row.hide_from_all && row.category_id.trim() === '' ? (
						<p className="mt-2 text-[11px] text-amber-700">
							カテゴリ未設定のため、この作品はフロント側で表示されません。
						</p>
					) : null }
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
