import { useMemo, useState, type FormEvent } from 'react';
import { postPublicReview } from '../../lib/createPublicReview';
import type { FrontendViewModel } from '../../frontend/normalizeViewModel';

type Props = {
	vm: FrontendViewModel;
	siteUrl: string;
};

type ReviewTarget = {
	itemType: 'youtube' | 'illustration';
	itemId: string;
	itemTitle: string;
};

function normalizeReturnUrl(
	preferredUrl: string,
	fallbackUrl: string
): string {
	const preferred = preferredUrl.trim();
	if ( preferred !== '' ) {
		try {
			return new URL( preferred ).toString();
		} catch {
			/* ignore invalid preferred URL */
		}
	}
	const fallback = fallbackUrl.trim();
	if ( fallback !== '' ) {
		try {
			return new URL( fallback ).toString();
		} catch {
			/* ignore invalid fallback URL */
		}
	}
	return '#';
}

function resolveTarget( vm: FrontendViewModel ): ReviewTarget | null {
	const params = new URLSearchParams( window.location.search );
	const rawType = ( params.get( 'mebuki_review_target' ) ?? '' ).trim();
	const itemType =
		rawType === 'youtube' || rawType === 'illustration' ? rawType : null;
	const itemId = ( params.get( 'item_id' ) ?? '' ).trim();
	if ( ! itemType || itemId === '' ) {
		return null;
	}

	const list =
		itemType === 'youtube'
			? vm.youtube_gallery.items
			: vm.illustration_gallery.items;
	const found = list.find( ( row ) => row.item_id.trim() === itemId );
	if ( ! found ) {
		return null;
	}

	const fallback = itemType === 'youtube' ? 'YouTube作品' : 'イラスト作品';
	return {
		itemType,
		itemId,
		itemTitle: found.title.trim() !== '' ? found.title : fallback,
	};
}

export function ReviewSubmitPage( { vm, siteUrl }: Props ) {
	const root = window.mebukiPmSettings?.root;
	const userSlug = ( window.mebukiPmSettings?.portfolioUserSlug ?? '' ).trim();
	const uid = window.mebukiPmSettings?.portfolioUserId;
	const target = useMemo( () => resolveTarget( vm ), [ vm ] );
	const returnUrl = useMemo(
		() => normalizeReturnUrl( vm.portfolio_site_url, siteUrl ),
		[ vm.portfolio_site_url, siteUrl ]
	);

	const [ reviewerName, setReviewerName ] = useState( '' );
	const [ reviewerThumbUrl, setReviewerThumbUrl ] = useState( '' );
	const [ reviewText, setReviewText ] = useState( '' );
	const [ touched, setTouched ] = useState( false );
	const [ submitting, setSubmitting ] = useState( false );
	const [ submitError, setSubmitError ] = useState<string | null>( null );
	const [ success, setSuccess ] = useState( false );

	const nameError =
		touched && reviewerName.trim() === '' ? 'お名前を入力してください。' : null;
	const textError =
		touched && reviewText.trim() === '' ? '口コミ内容を入力してください。' : null;

	const canSubmit =
		!!target &&
		!!root &&
		( userSlug !== '' ||
			( uid !== undefined && uid !== null && uid > 0 ) ) &&
		reviewerName.trim() !== '' &&
		reviewText.trim() !== '';

	async function onSubmit( e: FormEvent ) {
		e.preventDefault();
		setTouched( true );
		setSubmitError( null );

		if (
			!target ||
			!root ||
			( userSlug === '' && ( uid === undefined || uid === null || uid <= 0 ) )
		) {
			setSubmitError( '投稿設定を読み込めませんでした。URL をご確認ください。' );
			return;
		}

		if ( reviewerName.trim() === '' || reviewText.trim() === '' ) {
			return;
		}

		setSubmitting( true );
		const result = await postPublicReview( root, {
			user_slug: userSlug || undefined,
			user_id: uid,
			item_type: target.itemType,
			item_id: target.itemId,
			reviewer_name: reviewerName.trim(),
			reviewer_thumbnail_url: reviewerThumbUrl.trim(),
			review_text: reviewText.trim(),
		} );
		setSubmitting( false );

		if ( result.ok ) {
			setSuccess( true );
			return;
		}

		setSubmitError( result.message );
	}

	return (
		<main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
			<section className="overflow-hidden rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_12%,transparent)] bg-[var(--mebuki-surface)] shadow-sm">
				<div className="border-b border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] px-6 py-5">
					<h1 className="font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)]">
						口コミ投稿フォーム
					</h1>
					<p className="mt-2 text-sm text-[var(--mebuki-text-muted)]">
						送信後は未公開で保存され、管理者の承認後に公開されます。
					</p>
				</div>

				{ ! target ? (
					<div className="px-6 py-8">
						<p className="text-sm text-rose-700">
							対象作品を特定できませんでした。口コミURLを再発行してお試しください。
						</p>
					</div>
				) : success ? (
					<div className="space-y-4 px-6 py-8">
						<p className="text-base font-medium text-emerald-700">
							口コミを送信しました。
						</p>
						<p className="text-sm text-[var(--mebuki-text-muted)]">
							承認後に作品ページと口コミ一覧へ反映されます。
						</p>
						<a
							href={ returnUrl }
							className="inline-flex items-center justify-center rounded-[var(--mebuki-radius)] bg-[var(--mebuki-accent)] px-4 py-2 text-sm font-semibold text-white"
						>
							ポートフォリオサイトへ
						</a>
					</div>
				) : (
					<form className="space-y-5 px-6 py-6" onSubmit={ onSubmit } noValidate>
						<div className="rounded-[var(--mebuki-radius)] bg-[color-mix(in_srgb,var(--mebuki-bg)_70%,var(--mebuki-surface))] p-4 text-sm">
							<p className="text-[var(--mebuki-text-muted)]">対象</p>
							<p className="mt-1 font-medium text-[var(--mebuki-text)]">
								{ target.itemType === 'youtube' ? 'YouTube' : 'Illustration' } /{ ' ' }
								{ target.itemTitle }
							</p>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]">
								お名前 <span className="text-rose-600">*</span>
							</label>
							<input
								type="text"
								value={ reviewerName }
								onChange={ ( e ) => setReviewerName( e.target.value ) }
								className="w-full rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
								aria-invalid={ Boolean( nameError ) }
								disabled={ submitting }
							/>
							{ nameError ? (
								<p className="mt-1 text-xs text-rose-600">{ nameError }</p>
							) : null }
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]">
								プロフィール画像URL（任意）
							</label>
							<input
								type="url"
								value={ reviewerThumbUrl }
								onChange={ ( e ) => setReviewerThumbUrl( e.target.value ) }
								className="w-full rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
								disabled={ submitting }
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]">
								口コミ内容 <span className="text-rose-600">*</span>
							</label>
							<textarea
								rows={ 6 }
								value={ reviewText }
								onChange={ ( e ) => setReviewText( e.target.value ) }
								className="w-full resize-y rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
								aria-invalid={ Boolean( textError ) }
								disabled={ submitting }
							/>
							{ textError ? (
								<p className="mt-1 text-xs text-rose-600">{ textError }</p>
							) : null }
						</div>

						{ submitError ? (
							<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
								{ submitError }
							</p>
						) : null }

						<div className="flex items-center gap-3">
							<button
								type="submit"
								disabled={ submitting || !canSubmit }
								className="rounded-[var(--mebuki-radius)] bg-[var(--mebuki-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
							>
								{ submitting ? '送信中…' : '口コミを投稿する' }
							</button>
							<a
								href={ returnUrl }
								className="text-sm text-[var(--mebuki-accent)] underline"
							>
								ポートフォリオサイトへ
							</a>
						</div>
					</form>
				) }
			</section>
		</main>
	);
}
