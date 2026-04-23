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
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
	deleteReview,
	fetchReviewsMe,
	patchReviewVisibility,
	reorderReviews,
} from '../../lib/reviewsApi';
import type { MebukiFormState } from '../../types/settings';
import type { ReviewRow } from '../../types/settings';
import { MediaPickerButton } from '../MediaPickerButton';
import type { ToastVariant } from '../Toast';

type Props = {
	root: string;
	nonce: string;
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
	onNotify: ( message: string, variant: ToastVariant ) => void;
};

function isPublicStatus( status: string ): boolean {
	return status === 'published';
}

type SortableRowProps = {
	row: ReviewRow;
	disabled: boolean;
	dragDisabled: boolean;
	pub: boolean;
	onToggle: () => void;
	onRemove: () => void;
};

function SortableReviewRow( {
	row,
	disabled,
	dragDisabled,
	pub,
	onToggle,
	onRemove,
}: SortableRowProps ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: row.id, disabled: dragDisabled } );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.88 : 1,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
		>
			<div className="flex gap-2 sm:gap-3">
				<button
					type="button"
					className="mt-0.5 inline-flex h-max shrink-0 cursor-grab touch-none rounded border border-slate-200 bg-white px-1.5 py-1 text-slate-500 hover:bg-slate-50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
					{ ...listeners }
					{ ...attributes }
					aria-label="口コミの並び替え"
					disabled={ disabled || dragDisabled }
				>
					<span aria-hidden className="text-sm leading-none">
						⋮⋮
					</span>
				</button>
				<div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 flex-1 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium text-slate-800">
								{ row.reviewer_name }
							</span>
							<span
								className={ `rounded-full px-2 py-0.5 text-xs ${
									row.status === 'pending'
										? 'bg-amber-100 text-amber-800'
										: pub
											? 'bg-emerald-100 text-emerald-800'
											: 'bg-slate-200 text-slate-700'
								}` }
							>
								{ row.status === 'pending'
									? '承認待ち'
									: pub
										? '公開中'
										: '非公開' }
							</span>
						</div>
						<p className="whitespace-pre-wrap text-sm text-slate-600">
							{ row.review_text }
						</p>
						<p className="text-xs text-slate-400">
							{ row.item_type } / { row.item_id } — ID { row.id }
						</p>
					</div>
					<div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
						<div className="flex items-center gap-2 sm:flex-col sm:items-end">
							<span className="text-xs text-slate-500">公開</span>
							<button
								type="button"
								role="switch"
								aria-checked={ pub }
								disabled={ disabled }
								onClick={ onToggle }
								className={ `relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-50 ${
									pub ? 'bg-emerald-500' : 'bg-slate-300'
								}` }
							>
								<span
									className={ `absolute top-1 block h-6 w-6 rounded-full bg-white shadow transition ${
										pub ? 'left-7' : 'left-1'
									}` }
								/>
							</button>
						</div>
						<button
							type="button"
							disabled={ disabled }
							onClick={ onRemove }
							className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
						>
							削除
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function ReviewsSection( {
	root,
	nonce,
	form,
	setForm,
	onNotify,
}: Props ) {
	const [ reviews, setReviews ] = useState<ReviewRow[]>( [] );
	const [ loading, setLoading ] = useState( true );
	const [ err, setErr ] = useState<string | null>( null );
	const [ busyId, setBusyId ] = useState<number | null>( null );
	const [ reorderBusy, setReorderBusy ] = useState( false );

	const sortableIds = useMemo( () => reviews.map( ( r ) => r.id ), [ reviews ] );

	const load = useCallback( async () => {
		setLoading( true );
		setErr( null );
		try {
			const rows = await fetchReviewsMe( root, nonce );
			setReviews( rows );
		} catch ( e ) {
			setErr(
				e instanceof Error ? e.message : '口コミの読み込みに失敗しました。'
			);
		} finally {
			setLoading( false );
		}
	}, [ nonce, root ] );

	useEffect( () => {
		void load();
	}, [ load ] );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const dragLocked = reorderBusy || busyId !== null;

	const persistOrder = async ( next: ReviewRow[] ) => {
		setReorderBusy( true );
		try {
			await reorderReviews(
				root,
				nonce,
				next.map( ( r ) => r.id )
			);
			onNotify( '表示順を保存しました。', 'success' );
		} catch ( e ) {
			await load();
			onNotify(
				e instanceof Error ? e.message : '表示順の保存に失敗しました。',
				'error'
			);
		} finally {
			setReorderBusy( false );
		}
	};

	const onDragEnd = ( event: DragEndEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id || dragLocked ) {
			return;
		}
		const oldIndex = reviews.findIndex( ( r ) => r.id === active.id );
		const newIndex = reviews.findIndex( ( r ) => r.id === over.id );
		if ( oldIndex === -1 || newIndex === -1 ) {
			return;
		}
		const next = arrayMove( reviews, oldIndex, newIndex );
		setReviews( next );
		void persistOrder( next );
	};

	const toggle = async ( row: ReviewRow, makePublic: boolean ) => {
		setBusyId( row.id );
		try {
			const updated = await patchReviewVisibility(
				root,
				nonce,
				row.id,
				makePublic ? 'public' : 'private'
			);
			setReviews( ( rs ) =>
				rs.map( ( r ) => ( r.id === updated.id ? updated : r ) )
			);
			onNotify(
				makePublic ? 'この口コミを公開にしました。' : '非公開にしました。',
				'success'
			);
		} catch ( e ) {
			onNotify(
				e instanceof Error ? e.message : '更新に失敗しました。',
				'error'
			);
		} finally {
			setBusyId( null );
		}
	};

	const remove = async ( row: ReviewRow ) => {
		if (
			! window.confirm(
				'この口コミを削除しますか？この操作は取り消せません。'
			)
		) {
			return;
		}
		setBusyId( row.id );
		try {
			await deleteReview( root, nonce, row.id );
			setReviews( ( rs ) => rs.filter( ( r ) => r.id !== row.id ) );
			onNotify( '口コミを削除しました。', 'success' );
		} catch ( e ) {
			onNotify(
				e instanceof Error ? e.message : '削除に失敗しました。',
				'error'
			);
		} finally {
			setBusyId( null );
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				<label
					htmlFor="portfolio-site-url"
					className="mb-1 block text-sm font-medium text-slate-800"
				>
					ポートフォリオサイトアドレス
				</label>
				<input
					id="portfolio-site-url"
					type="url"
					inputMode="url"
					placeholder="https://example.com/"
					value={ form.portfolio_site_url }
					onChange={ ( e ) =>
						setForm( ( prev ) => ( {
							...prev,
							portfolio_site_url: e.target.value,
						} ) )
					}
					className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
				/>
				<p className="mt-2 text-xs text-slate-500">
					口コミ投稿完了後の「ポートフォリオサイトへ」リンク先です。未入力時はサイトURLに戻ります。
				</p>
				<div className="mt-4">
					<label className="mb-1 block text-sm font-medium text-slate-800">
						ダミーアイコン画像
					</label>
					<MediaPickerButton
						label="メディアライブラリから画像を選ぶ"
						value={ form.review_fallback_icon_url }
						onChange={ ( url ) =>
							setForm( ( prev ) => ( {
								...prev,
								review_fallback_icon_url: url,
							} ) )
						}
					/>
					{ form.review_fallback_icon_url.trim() !== '' ? (
						<button
							type="button"
							className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
							onClick={ () =>
								setForm( ( prev ) => ( {
									...prev,
									review_fallback_icon_url: '',
								} ) )
							}
						>
							ダミーアイコン画像を削除
						</button>
					) : null }
					<p className="mt-2 text-xs text-slate-500">
						口コミ投稿者の画像が未設定のときに表示するフォールバック画像です。
					</p>
				</div>
				<div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
					<div>
						<p className="text-sm font-medium text-slate-800">
							作品にも口コミを表示する
						</p>
						<p className="text-xs text-slate-500">
							ON のとき YouTube / Illustration の各作品下に口コミを表示します。
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={ form.show_reviews_under_items }
						onClick={ () =>
							setForm( ( prev ) => ( {
								...prev,
								show_reviews_under_items: ! prev.show_reviews_under_items,
							} ) )
						}
						className={ `relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 ${
							form.show_reviews_under_items ? 'bg-emerald-500' : 'bg-slate-300'
						}` }
					>
						<span
							className={ `absolute top-1 block h-6 w-6 rounded-full bg-white shadow transition ${
								form.show_reviews_under_items ? 'left-7' : 'left-1'
							}` }
						/>
					</button>
				</div>
			</div>
			{ loading ? (
				<p className="text-sm text-slate-500">口コミを読み込み中…</p>
			) : err ? (
				<div className="space-y-2">
					<p className="text-sm text-rose-600">{ err }</p>
					<button
						type="button"
						className="text-sm text-sky-700 underline"
						onClick={ () => void load() }
					>
						再読み込み
					</button>
				</div>
			) : reviews.length === 0 ? (
				<p className="text-sm text-slate-500">
					まだ口コミはありません。公開フォームから送信されるとここに表示されます。
				</p>
			) : (
				<div className="space-y-3">
					<p className="text-xs text-slate-500">
						⋮⋮ をドラッグして表示順を変更できます。先頭の口コミがサイト上で最も早く表示されます。
						{ reorderBusy ? (
							<span className="ml-2 font-medium text-sky-700">
								表示順を保存しています…
							</span>
						) : null }
					</p>
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						onDragEnd={ onDragEnd }
					>
						<SortableContext
							items={ sortableIds }
							strategy={ verticalListSortingStrategy }
						>
							<div className="space-y-3">
								{ reviews.map( ( row ) => {
									const pub = isPublicStatus( row.status );
									const disabled = busyId === row.id;
									return (
										<SortableReviewRow
											key={ row.id }
											row={ row }
											disabled={ disabled }
											dragDisabled={ dragLocked }
											pub={ pub }
											onToggle={ () => void toggle( row, ! pub ) }
											onRemove={ () => void remove( row ) }
										/>
									);
								} ) }
							</div>
						</SortableContext>
					</DndContext>
				</div>
			) }
		</div>
	);
}
