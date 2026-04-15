import { StrictMode, CSSProperties } from 'react';
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
