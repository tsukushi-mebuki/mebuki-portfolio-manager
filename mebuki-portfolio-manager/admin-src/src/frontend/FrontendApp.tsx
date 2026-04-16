import { useMemo } from 'react';
import { toFrontendViewModel } from './normalizeViewModel';
import { HeroSection } from '../components/frontend/HeroSection';
import { SectionRenderer } from './SectionRenderer';
import { ReviewSubmitPage } from '../components/frontend/ReviewSubmitPage';

export function FrontendApp() {
	const siteName = window.mebukiPmSettings?.siteName ?? '';
	const siteUrl = window.mebukiPmSettings?.siteUrl ?? '';
	const pathname = window.location.pathname.toLowerCase();
	const isReviewPage = pathname.endsWith( '/reviews' ) || pathname.endsWith( '/reviews/' );

	const vm = useMemo(
		() => toFrontendViewModel( window.mebukiPmSettings?.settings ),
		[]
	);

	if ( isReviewPage ) {
		return <ReviewSubmitPage vm={ vm } siteUrl={ siteUrl } />;
	}

	return (
		<div className="min-h-screen bg-[var(--mebuki-bg)] pb-20 text-[var(--mebuki-text)] antialiased">
			<HeroSection siteName={ siteName } hero={ vm.hero } />
			{ vm.layout_order.map( ( id ) => (
				<SectionRenderer
					key={ id }
					sectionId={ id }
					vm={ vm }
					siteUrl={ siteUrl }
				/>
			) ) }
		</div>
	);
}
