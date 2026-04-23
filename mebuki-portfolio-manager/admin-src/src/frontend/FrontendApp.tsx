import { useEffect, useMemo, useState } from 'react';
import { toFrontendViewModel } from './normalizeViewModel';
import { SectionRenderer } from './SectionRenderer';
import { ReviewSubmitPage } from '../components/frontend/ReviewSubmitPage';
import type { ReviewRow } from '../types/settings';
import { publishedReviewsUrlBySlug } from './restUrl';

export function FrontendApp() {
	const siteUrl = window.mebukiPmSettings?.siteUrl ?? '';
	const pathname = window.location.pathname.toLowerCase();
	const qs = new URLSearchParams( window.location.search );
	const hasReviewQuery =
		( qs.get( 'mebuki_review_target' ) ?? '' ).trim() !== '' &&
		( qs.get( 'item_id' ) ?? '' ).trim() !== '';
	const isReviewPage =
		pathname.endsWith( '/reviews' ) ||
		pathname.endsWith( '/reviews/' ) ||
		hasReviewQuery;

	const vm = useMemo(
		() => toFrontendViewModel( window.mebukiPmSettings?.settings ),
		[]
	);
	const [ publishedReviews, setPublishedReviews ] = useState<ReviewRow[] | null>(
		null
	);

	useEffect( () => {
		const root = window.mebukiPmSettings?.root;
		const userSlug = ( window.mebukiPmSettings?.portfolioUserSlug ?? '' ).trim();
		if ( ! root || userSlug === '' ) {
			setPublishedReviews( [] );
			return;
		}
		let cancelled = false;
		( async () => {
			try {
				const url = publishedReviewsUrlBySlug( root, userSlug );
				const res = await fetch( url, {
					credentials: 'same-origin',
					headers: { Accept: 'application/json' },
				} );
				if ( ! res.ok ) {
					throw new Error( 'fetch failed' );
				}
				const data = ( await res.json() ) as { reviews?: ReviewRow[] };
				const list = Array.isArray( data.reviews ) ? data.reviews : [];
				if ( ! cancelled ) {
					setPublishedReviews( list );
				}
			} catch {
				if ( ! cancelled ) {
					setPublishedReviews( [] );
				}
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [] );

	if ( isReviewPage ) {
		return <ReviewSubmitPage vm={ vm } siteUrl={ siteUrl } />;
	}

	return (
		<div className="min-h-screen bg-[var(--mebuki-bg)] pb-20 text-[var(--mebuki-text)] antialiased">
			{ vm.layout_order.map( ( id ) => (
				<SectionRenderer
					key={ id }
					sectionId={ id }
					vm={ vm }
					siteUrl={ siteUrl }
					publishedReviews={ publishedReviews }
				/>
			) ) }
		</div>
	);
}
