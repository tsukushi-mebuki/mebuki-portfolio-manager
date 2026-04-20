import type { ReactNode } from 'react';
import type { ReviewRow, SectionId } from '../types/settings';
import type { FrontendViewModel } from './normalizeViewModel';
import { AboutSection } from '../components/frontend/AboutSection';
import { YouTubeGallery } from '../components/frontend/YouTubeGallery';
import { IllustrationGallery } from '../components/frontend/IllustrationGallery';
import { LinkCards } from '../components/frontend/LinkCards';
import { PricingSection } from '../components/frontend/PricingSection';
import { FAQSection } from '../components/frontend/FAQSection';
import { ReviewSection } from '../components/frontend/ReviewSection';
import { CredoSection } from '../components/frontend/CredoSection';
import { HeroSection } from '../components/frontend/HeroSection';

type Props = {
	sectionId: SectionId;
	vm: FrontendViewModel;
	siteName: string;
	siteUrl: string;
	publishedReviews: ReviewRow[] | null;
};

type SectionRenderContext = {
	vm: FrontendViewModel;
	siteName: string;
	siteUrl: string;
};

/**
 * Maps each persisted section id to a React subtree (schema-driven layout).
 */
const SECTION_REGISTRY: Record<
	SectionId,
	( ctx: SectionRenderContext ) => ReactNode
> = {
	hero: ( { vm, siteName } ) => <HeroSection siteName={ siteName } hero={ vm.hero } />,
	about: ( { vm } ) => <AboutSection items={ vm.about.items } />,
	credo: ( { vm } ) => <CredoSection credo={ vm.credo } />,
	'youtube_gallery': () => null,
	'illustration_gallery': () => null,
	'link_cards': ( { vm } ) => <LinkCards items={ vm.link_cards.items } />,
	pricing: ( { vm } ) => <PricingSection pricing={ vm.pricing } />,
	faq: ( { vm } ) => <FAQSection items={ vm.faq.items } />,
	reviews: () => null,
};

export function SectionRenderer( { sectionId, vm, siteName, siteUrl, publishedReviews }: Props ) {
	const render = SECTION_REGISTRY[ sectionId ];
	if ( ! render ) {
		return null;
	}
	if ( sectionId === 'youtube_gallery' ) {
		return (
			<YouTubeGallery
				items={ vm.youtube_gallery.items }
				siteUrl={ siteUrl }
				publishedReviews={ publishedReviews ?? [] }
				showReviewsUnderItems={ vm.show_reviews_under_items }
				reviewFallbackIconUrl={ vm.review_fallback_icon_url }
			/>
		);
	}
	if ( sectionId === 'illustration_gallery' ) {
		return (
			<IllustrationGallery
				items={ vm.illustration_gallery.items }
				siteUrl={ siteUrl }
				publishedReviews={ publishedReviews ?? [] }
				showReviewsUnderItems={ vm.show_reviews_under_items }
				reviewFallbackIconUrl={ vm.review_fallback_icon_url }
			/>
		);
	}
	if ( sectionId === 'reviews' ) {
		return (
			<ReviewSection
				reviews={ publishedReviews }
				fallbackIconUrl={ vm.review_fallback_icon_url }
			/>
		);
	}
	return render( { vm, siteName, siteUrl } );
}
