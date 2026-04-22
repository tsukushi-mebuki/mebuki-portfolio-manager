import { useEffect, useMemo, useState } from 'react';
import type { GalleryCategory, GalleryReviewItem } from '../../types/settings';
import type { ReviewRow } from '../../types/settings';
import { compareReviewsByDisplayOrder } from '../../lib/reviewSort';
import { ItemReviewsBlock } from './ItemReviewsBlock';

type Props = {
	categories: GalleryCategory[];
	items: GalleryReviewItem[];
	displayMode: 'tab' | 'category_sections';
	itemsPerPage: number;
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

export function IllustrationGallery( {
	categories,
	items,
	displayMode,
	itemsPerPage,
	publishedReviews,
	showReviewsUnderItems,
	reviewFallbackIconUrl,
}: Props ) {
	const visible = items.filter( ( row ) => row.url.trim() !== '' );
	const usableCategories = useMemo(
		() => categories.filter( ( row ) => row.id.trim() !== '' ).slice( 0, 4 ),
		[ categories ]
	);
	const [ activeTab, setActiveTab ] = useState<string>( 'all' );
	const [ pageByTab, setPageByTab ] = useState<Record<string, number>>( {} );
	const [ pageByCategory, setPageByCategory ] = useState<Record<string, number>>( {} );

	useEffect( () => {
		if ( activeTab === 'all' ) {
			return;
		}
		const exists = usableCategories.some( ( row ) => row.id === activeTab );
		if ( ! exists ) {
			setActiveTab( 'all' );
		}
	}, [ activeTab, usableCategories ] );

	useEffect( () => {
		setPageByTab( {} );
	}, [ activeTab ] );

	const safeItemsPerPage = useMemo( () => {
		if ( ! Number.isFinite( itemsPerPage ) ) {
			return 10;
		}
		const n = Math.trunc( itemsPerPage );
		if ( n < 1 ) {
			return 1;
		}
		if ( n > 50 ) {
			return 50;
		}
		return n;
	}, [ itemsPerPage ] );

	const filtered = useMemo( () => {
		if ( activeTab === 'all' ) {
			return visible.filter( ( row ) => ! row.hide_from_all );
		}
		return visible.filter( ( row ) => row.category_id === activeTab );
	}, [ activeTab, visible ] );
	const currentPage = pageByTab[ activeTab ] ?? 1;
	const totalPages = Math.max(
		1,
		Math.ceil( filtered.length / safeItemsPerPage )
	);
	const clampedPage = currentPage > totalPages ? totalPages : currentPage;
	const paged = useMemo( () => {
		const start = ( clampedPage - 1 ) * safeItemsPerPage;
		return filtered.slice( start, start + safeItemsPerPage );
	}, [ clampedPage, filtered, safeItemsPerPage ] );

	useEffect( () => {
		if ( clampedPage !== currentPage ) {
			setPageByTab( ( prev ) => ( { ...prev, [ activeTab ]: clampedPage } ) );
		}
	}, [ activeTab, clampedPage, currentPage ] );

	const renderCard = ( row: GalleryReviewItem, i: number ) => {
		const url = row.url.trim();
		const showImg = isImageUrl( url );
		const itemReviews = showReviewsUnderItems
			? publishedReviews
					.filter(
						( r ) =>
							r.item_type === 'illustration' && r.item_id === row.item_id
					)
					.sort( compareReviewsByDisplayOrder )
					.slice( 0, 3 )
			: [];
		return (
			<article
				key={ `${ url }-${ i }` }
				className="group flex min-w-[240px] flex-col overflow-hidden rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] shadow-sm transition hover:shadow-md sm:min-w-0"
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
					<ItemReviewsBlock
						reviews={ itemReviews }
						fallbackIconUrl={ reviewFallbackIconUrl }
					/>
				</div>
			</article>
		);
	};

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
			{ displayMode === 'category_sections' ? (
				<div className="space-y-10">
					{ usableCategories.map( ( category ) => {
						const sectionItems = visible.filter(
							( row ) => row.category_id === category.id
						);
						if ( sectionItems.length === 0 ) {
							return null;
						}
						const page = pageByCategory[ category.id ] ?? 1;
						const total = Math.max(
							1,
							Math.ceil( sectionItems.length / safeItemsPerPage )
						);
						const safePage = page > total ? total : page;
						const start = ( safePage - 1 ) * safeItemsPerPage;
						const sectionPaged = sectionItems.slice(
							start,
							start + safeItemsPerPage
						);
						return (
							<section key={ category.id } className="space-y-3">
								<h3 className="font-[family-name:var(--mebuki-font-heading)] text-xl font-semibold text-[var(--mebuki-text)]">
									{ category.title.trim() || '(無題カテゴリ)' }
								</h3>
								<div className="flex gap-4 overflow-x-auto pb-2">
									{ sectionPaged.map( ( row, i ) => renderCard( row, i ) ) }
								</div>
								{ total > 1 ? (
									<div className="flex items-center justify-center gap-2">
										<button
											type="button"
											className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
											disabled={ safePage <= 1 }
											onClick={ () =>
												setPageByCategory( ( prev ) => ( {
													...prev,
													[ category.id ]: Math.max( 1, safePage - 1 ),
												} ) )
											}
										>
											前へ
										</button>
										<span className="text-sm text-[var(--mebuki-text)]">
											{ safePage } / { total }
										</span>
										<button
											type="button"
											className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
											disabled={ safePage >= total }
											onClick={ () =>
												setPageByCategory( ( prev ) => ( {
													...prev,
													[ category.id ]: Math.min( total, safePage + 1 ),
												} ) )
											}
										>
											次へ
										</button>
									</div>
								) : null }
							</section>
						);
					} ) }
				</div>
			) : (
				<>
					<div className="mb-6 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={ () => setActiveTab( 'all' ) }
							className={ `rounded-full border px-3 py-1.5 text-sm transition ${
								activeTab === 'all'
									? 'border-[var(--mebuki-accent)] bg-[var(--mebuki-accent)] text-white'
									: 'border-[color-mix(in_srgb,var(--mebuki-text)_20%,transparent)] text-[var(--mebuki-text)] hover:bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]'
							}` }
						>
							ALL
						</button>
						{ usableCategories.map( ( category ) => (
							<button
								key={ category.id }
								type="button"
								onClick={ () => setActiveTab( category.id ) }
								className={ `rounded-full border px-3 py-1.5 text-sm transition ${
									activeTab === category.id
										? 'border-[var(--mebuki-accent)] bg-[var(--mebuki-accent)] text-white'
										: 'border-[color-mix(in_srgb,var(--mebuki-text)_20%,transparent)] text-[var(--mebuki-text)] hover:bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]'
								}` }
							>
								{ category.title.trim() || '(無題カテゴリ)' }
							</button>
						) ) }
					</div>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{ paged.map( ( row, i ) => renderCard( row, i ) ) }
					</div>
					{ totalPages > 1 ? (
						<div className="mt-6 flex items-center justify-center gap-2">
							<button
								type="button"
								className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
								disabled={ clampedPage <= 1 }
								onClick={ () =>
									setPageByTab( ( prev ) => ( {
										...prev,
										[ activeTab ]: Math.max( 1, clampedPage - 1 ),
									} ) )
								}
							>
								前へ
							</button>
							<span className="text-sm text-[var(--mebuki-text)]">
								{ clampedPage } / { totalPages }
							</span>
							<button
								type="button"
								className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
								disabled={ clampedPage >= totalPages }
								onClick={ () =>
									setPageByTab( ( prev ) => ( {
										...prev,
										[ activeTab ]: Math.min( totalPages, clampedPage + 1 ),
									} ) )
								}
							>
								次へ
							</button>
						</div>
					) : null }
				</>
			) }
		</section>
	);
}
