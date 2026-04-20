import { StrictMode, CSSProperties, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
	normalizeThemePreset,
	resolveThemeFromRaw,
	type ThemeTokens,
} from './frontendTheme';
import { FrontendApp } from './frontend/FrontendApp';
import './frontend.css';

type MebukiPmWindowConfig = {
	root?: string;
	nonce?: string;
	settings?: Record<string, unknown>;
	portfolioUserId?: number;
	portfolioUserSlug?: string;
	portfolioPath?: string;
	siteName?: string;
	siteUrl?: string;
};

declare global {
	interface Window {
		mebukiPmSettings?: MebukiPmWindowConfig;
	}
}

function themeToCssVars( theme: ThemeTokens ): CSSProperties {
	return {
		'--mebuki-bg': theme.background,
		'--mebuki-surface': theme.surface,
		'--mebuki-accent': theme.accent,
		'--mebuki-accent-muted': theme.accentMuted,
		'--mebuki-text': theme.text,
		'--mebuki-text-muted': theme.textMuted,
		'--mebuki-font-heading': theme.fontHeading,
		'--mebuki-font-body': theme.fontBody,
		'--mebuki-radius': theme.radius,
	} as CSSProperties;
}

function FrontendShell() {
	useLayoutEffect( () => {
		let rafId = 0;

		const adjustBleedWidth = () => {
			const viewportWidth = document.documentElement.clientWidth;
			const bleedElements = document.querySelectorAll< HTMLElement >(
				'.mebuki-portfolio-bleed'
			);
			if ( ! bleedElements.length ) {
				return;
			}

			bleedElements.forEach( ( element ) => {
				const parent = element.parentElement;
				if ( ! parent ) {
					return;
				}

				// Reset once so parent position can be measured accurately.
				element.style.marginLeft = '0px';
				element.style.width = '100%';
				element.style.maxWidth = '100%';

				const parentRect = parent.getBoundingClientRect();
				element.style.marginLeft = `-${ parentRect.left }px`;
				element.style.width = `${ viewportWidth }px`;
				element.style.maxWidth = `${ viewportWidth }px`;
			} );
		};

		const scheduleAdjust = () => {
			window.cancelAnimationFrame( rafId );
			rafId = window.requestAnimationFrame( adjustBleedWidth );
		};

		scheduleAdjust();

		const resizeObserver = new ResizeObserver( scheduleAdjust );
		resizeObserver.observe( document.documentElement );
		window.addEventListener( 'resize', scheduleAdjust, { passive: true } );

		return () => {
			window.cancelAnimationFrame( rafId );
			resizeObserver.disconnect();
			window.removeEventListener( 'resize', scheduleAdjust );
		};
	}, [] );

	const raw = window.mebukiPmSettings?.settings;
	const preset = normalizeThemePreset( raw?.theme_preset );
	const theme = resolveThemeFromRaw( raw?.theme, preset );
	return (
		<div
			className="min-h-screen font-[family-name:var(--mebuki-font-body)]"
			data-theme={ preset }
			style={ themeToCssVars( theme ) }
		>
			<FrontendApp />
		</div>
	);
}

const mount = document.getElementById( 'mebuki-frontend-root' );

if ( mount ) {
	createRoot( mount ).render(
		<StrictMode>
			<FrontendShell />
		</StrictMode>
	);
}
