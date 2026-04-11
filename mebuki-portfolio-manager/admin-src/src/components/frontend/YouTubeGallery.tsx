import type { GalleryReviewItem } from '../../types/settings';
import { youtubeEmbedSrc, youtubeThumbUrl } from '../../frontend/youtube';
import { ReviewWriteButton } from './ReviewWriteButton';

type Props = {
	items: GalleryReviewItem[];
	siteUrl: string;
};

export function YouTubeGallery( { items, siteUrl }: Props ) {
	const visible = items.filter( ( row ) => row.url.trim() !== '' );
	if ( visible.length === 0 ) {
		return null;
	}

	return (
		<section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="mebuki-youtube-heading">
			<h2
				id="mebuki-youtube-heading"
				className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				YouTube
			</h2>
			<div className="grid gap-8 sm:grid-cols-2">
				{ visible.map( ( row, i ) => {
					const embed = youtubeEmbedSrc( row.url );
					const thumb = youtubeThumbUrl( row.url );
					return (
						<article
							key={ `${ row.url }-${ i }` }
							className="flex flex-col overflow-hidden rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] shadow-sm"
						>
							<div className="aspect-video w-full bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]">
								{ embed ? (
									<iframe
										title={ row.title || 'YouTube video' }
										src={ embed }
										className="h-full w-full"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
										allowFullScreen
									/>
								) : thumb ? (
									<a
										href={ row.url }
										target="_blank"
										rel="noopener noreferrer"
										className="block h-full w-full"
									>
										<img src={ thumb } alt="" className="h-full w-full object-cover" />
									</a>
								) : (
									<a
										href={ row.url }
										target="_blank"
										rel="noopener noreferrer"
										className="flex h-full items-center justify-center p-4 text-sm text-[var(--mebuki-accent)] underline"
									>
										動画を開く
									</a>
								) }
							</div>
							<div className="flex flex-1 flex-col gap-3 p-4">
								{ row.title.trim() !== '' ? (
									<h3 className="font-[family-name:var(--mebuki-font-heading)] text-lg font-semibold text-[var(--mebuki-text)]">
										{ row.title }
									</h3>
								) : null }
								<div className="mt-auto flex flex-wrap items-center justify-end gap-2">
									<ReviewWriteButton
										siteUrl={ siteUrl }
										itemType="youtube"
										itemId={ row.item_id }
									/>
								</div>
							</div>
						</article>
					);
				} ) }
			</div>
		</section>
	);
}
