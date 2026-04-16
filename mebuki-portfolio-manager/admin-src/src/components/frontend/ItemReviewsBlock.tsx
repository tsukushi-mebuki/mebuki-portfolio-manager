import type { ReviewRow } from '../../types/settings';

type Props = {
	reviews: ReviewRow[];
	fallbackIconUrl: string;
};

export function ItemReviewsBlock( { reviews, fallbackIconUrl }: Props ) {
	if ( reviews.length === 0 ) {
		return null;
	}
	const fallback = fallbackIconUrl.trim();

	return (
		<ul className="mt-3 space-y-2">
			{ reviews.map( ( row ) => {
				const thumb = row.reviewer_thumbnail_url.trim();
				const icon = thumb !== '' ? thumb : fallback;
				return (
					<li
						key={ row.id }
						className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-bg)_70%,var(--mebuki-surface))] p-3"
					>
						<div className="flex gap-3">
							{ icon !== '' ? (
								<img
									src={ icon }
									alt=""
									className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[color-mix(in_srgb,var(--mebuki-accent)_20%,transparent)]"
									loading="lazy"
								/>
							) : (
								<div
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mebuki-accent)_15%,transparent)] text-xs font-semibold text-[var(--mebuki-accent)]"
									aria-hidden
								>
									{ row.reviewer_name.trim().charAt( 0 ).toUpperCase() || '?' }
								</div>
							) }
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-[var(--mebuki-text)]">
									{ row.reviewer_name }
								</p>
								<p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--mebuki-text-muted)]">
									{ row.review_text }
								</p>
							</div>
						</div>
					</li>
				);
			} ) }
		</ul>
	);
}
