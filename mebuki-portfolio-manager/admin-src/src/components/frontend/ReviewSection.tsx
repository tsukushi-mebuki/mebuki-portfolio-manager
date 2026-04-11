import { useEffect, useState } from 'react';
import type { ReviewRow } from '../../types/settings';
import { publishedReviewsUrl } from '../../frontend/restUrl';

export function ReviewSection() {
	const [ reviews, setReviews ] = useState<ReviewRow[] | null>( null );

	useEffect( () => {
		const root = window.mebukiPmSettings?.root;
		const uid = window.mebukiPmSettings?.portfolioUserId;
		if ( ! root || uid === undefined || uid === null || uid <= 0 ) {
			setReviews( [] );
			return;
		}
		let cancelled = false;
		( async () => {
			try {
				const res = await fetch( publishedReviewsUrl( root, uid ), {
					credentials: 'same-origin',
					headers: { Accept: 'application/json' },
				} );
				if ( ! res.ok ) {
					throw new Error( 'fetch failed' );
				}
				const data = ( await res.json() ) as { reviews?: ReviewRow[] };
				const list = Array.isArray( data.reviews ) ? data.reviews : [];
				if ( ! cancelled ) {
					setReviews( list );
				}
			} catch {
				if ( ! cancelled ) {
					setReviews( [] );
				}
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [] );

	if ( reviews === null ) {
		return (
			<section
				className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
				aria-busy="true"
				aria-live="polite"
			>
				<p className="text-sm text-[var(--mebuki-text-muted)]">口コミを読み込み中です…</p>
			</section>
		);
	}
	if ( reviews.length === 0 ) {
		return null;
	}

	return (
		<section
			className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
			aria-labelledby="mebuki-reviews-heading"
		>
			<h2
				id="mebuki-reviews-heading"
				className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				Reviews
			</h2>
			<ul className="space-y-4">
				{ reviews.map( ( row ) => (
					<li
						key={ row.id }
						className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] p-5 shadow-sm"
					>
						<div className="flex gap-4">
							{ row.reviewer_thumbnail_url.trim() !== '' ? (
								<img
									src={ row.reviewer_thumbnail_url }
									alt=""
									className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[color-mix(in_srgb,var(--mebuki-accent)_25%,transparent)]"
									loading="lazy"
								/>
							) : (
								<div
									className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mebuki-accent)_15%,transparent)] text-sm font-semibold text-[var(--mebuki-accent)]"
									aria-hidden
								>
									{ row.reviewer_name.trim().charAt( 0 ).toUpperCase() || '?' }
								</div>
							) }
							<div className="min-w-0 flex-1">
								<p className="font-[family-name:var(--mebuki-font-heading)] font-semibold text-[var(--mebuki-text)]">
									{ row.reviewer_name }
								</p>
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--mebuki-text-muted)]">
									{ row.review_text }
								</p>
							</div>
						</div>
					</li>
				) ) }
			</ul>
		</section>
	);
}
