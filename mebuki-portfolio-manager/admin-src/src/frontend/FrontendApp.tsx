import { useMemo } from 'react';
import { toFrontendViewModel } from './normalizeViewModel';
import { HeroSection } from '../components/frontend/HeroSection';
import { CredoSection } from '../components/frontend/CredoSection';
import { SectionRenderer } from './SectionRenderer';

export function FrontendApp() {
	const siteName = window.mebukiPmSettings?.siteName ?? '';
	const siteUrl = window.mebukiPmSettings?.siteUrl ?? '';

	const vm = useMemo(
		() => toFrontendViewModel( window.mebukiPmSettings?.settings ),
		[]
	);

	return (
		<div className="min-h-screen bg-[var(--mebuki-bg)] pb-20 text-[var(--mebuki-text)] antialiased">
			<HeroSection siteName={ siteName } hero={ vm.hero } />
			<CredoSection credo={ vm.credo } />
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
