import { useCallback, useEffect, useState } from 'react';
import {
	fetchReviewsMe,
	patchReviewVisibility,
} from '../../lib/reviewsApi';
import type { ReviewRow } from '../../types/settings';
import type { MebukiFormState } from '../../types/settings';
import type { ToastVariant } from '../Toast';
import type { Dispatch, SetStateAction } from 'react';

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

	if ( loading ) {
		return (
			<p className="text-sm text-slate-500">口コミを読み込み中…</p>
		);
	}

	if ( err ) {
		return (
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
		);
	}

	if ( reviews.length === 0 ) {
		return (
			<p className="text-sm text-slate-500">
				まだ口コミはありません。公開フォームから送信されるとここに表示されます。
			</p>
		);
	}

	return (
		<div className="space-y-3">
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
			</div>
			{ reviews.map( ( row ) => {
				const pub = isPublicStatus( row.status );
				const disabled = busyId === row.id;
				return (
					<div
						key={ row.id }
						className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
							<div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
								<span className="text-xs text-slate-500">公開</span>
								<button
									type="button"
									role="switch"
									aria-checked={ pub }
									disabled={ disabled }
									onClick={ () => void toggle( row, ! pub ) }
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
						</div>
					</div>
				);
			} ) }
		</div>
	);
}
