import type { GalleryReviewItem } from '../../types/settings';
import type { ReviewRow } from '../../types/settings';
import { ReviewWriteButton } from './ReviewWriteButton';
import { ItemReviewsBlock } from './ItemReviewsBlock';

type Props = {
	items: GalleryReviewItem[];
	siteUrl: string;
	publishedReviews: ReviewRow[];
	showReviewsUnderItems: boolean;
	reviewFallbackIconUrl: string;
};

function isImageUrl( url: string ): boolean {
	const lower = url.toLowerCase();
	return (
		/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test( lower ) ||
		lower.includes( '/image' ) ||
		lower.includes( 'images' )
	);
}

function toEpochMs( v: string | null ): number {
	if ( ! v ) {
		return 0;
	}
	const t = Date.parse( v );
	return Number.isNaN( t ) ? 0 : t;
}

export function IllustrationGallery( {
	items,
	siteUrl,
	publishedReviews,
	showReviewsUnderItems,
	reviewFallbackIconUrl,
}: Props ) {
	const visible = items.filter( ( row ) => row.url.trim() !== '' );
	if ( visible.length === 0 ) {
		return null;
	}

	return (
		<section
			className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
			aria-labelledby="mebuki-illust-heading"
		>
			<h2
				id="mebuki-illust-heading"
				className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				Illustration
			</h2>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{ visible.map( ( row, i ) => {
					const url = row.url.trim();
					const showImg = isImageUrl( url );
					const itemReviews = showReviewsUnderItems
						? publishedReviews
								.filter(
									( r ) =>
										r.item_type === 'illustration' &&
										r.item_id === row.item_id
								)
								.sort(
									( a, b ) =>
										toEpochMs( a.created_at ) - toEpochMs( b.created_at )
								)
								.slice( 0, 3 )
						: [];
					return (
						<article
							key={ `${ url }-${ i }` }
							className="group flex flex-col overflow-hidden rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] shadow-sm transition hover:shadow-md"
						>
							<a
								href={ url }
								target="_blank"
								rel="noopener noreferrer"
								className="relative aspect-square overflow-hidden bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]"
							>
								{ showImg ? (
									<img
										src={ url }
										alt={ row.title || '' }
										className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
										loading="lazy"
									/>
								) : (
									<span className="flex h-full items-center justify-center p-4 text-center text-sm text-[var(--mebuki-accent)]">
										リンクを開く
									</span>
								) }
							</a>
							<div className="flex flex-1 flex-col gap-2 p-4">
								{ row.title.trim() !== '' ? (
									<h3 className="font-[family-name:var(--mebuki-font-heading)] text-base font-semibold text-[var(--mebuki-text)]">
										{ row.title }
									</h3>
								) : null }
								<div className="mt-auto flex justify-end">
									<ReviewWriteButton
										siteUrl={ siteUrl }
										itemType="illustration"
										itemId={ row.item_id }
									/>
								</div>
								<ItemReviewsBlock
									reviews={ itemReviews }
									fallbackIconUrl={ reviewFallbackIconUrl }
								/>
							</div>
						</article>
					);
				} ) }
			</div>
		</section>
	);
}
