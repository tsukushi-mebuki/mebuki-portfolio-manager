import type { ReactNode } from 'react';
import type { SectionId } from '../types/settings';
import type { FrontendViewModel } from './normalizeViewModel';
import { AboutSection } from '../components/frontend/AboutSection';
import { YouTubeGallery } from '../components/frontend/YouTubeGallery';
import { IllustrationGallery } from '../components/frontend/IllustrationGallery';
import { LinkCards } from '../components/frontend/LinkCards';
import { PricingSection } from '../components/frontend/PricingSection';
import { FAQSection } from '../components/frontend/FAQSection';
import { ReviewSection } from '../components/frontend/ReviewSection';

type Props = {
	sectionId: SectionId;
	vm: FrontendViewModel;
	siteUrl: string;
};

type SectionRenderContext = {
	vm: FrontendViewModel;
	siteUrl: string;
};

/**
 * Maps each persisted section id to a React subtree (schema-driven layout).
 */
const SECTION_REGISTRY: Record<
	SectionId,
	( ctx: SectionRenderContext ) => ReactNode
> = {
	about: ( { vm } ) => <AboutSection items={ vm.about.items } />,
	'youtube_gallery': ( { vm, siteUrl } ) => (
		<YouTubeGallery items={ vm.youtube_gallery.items } siteUrl={ siteUrl } />
	),
	'illustration_gallery': ( { vm, siteUrl } ) => (
		<IllustrationGallery
			items={ vm.illustration_gallery.items }
			siteUrl={ siteUrl }
		/>
	),
	'link_cards': ( { vm } ) => <LinkCards items={ vm.link_cards.items } />,
	pricing: ( { vm } ) => <PricingSection pricing={ vm.pricing } />,
	faq: ( { vm } ) => <FAQSection items={ vm.faq.items } />,
	reviews: () => <ReviewSection />,
};

export function SectionRenderer( { sectionId, vm, siteUrl }: Props ) {
	const render = SECTION_REGISTRY[ sectionId ];
	return render ? render( { vm, siteUrl } ) : null;
}
