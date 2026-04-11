/**
 * Theme resolution for the public frontend bundle only.
 * Logic mirrors `lib/themePresets.ts` so the Vite `frontend` entry stays self-contained
 * (no shared Rollup chunk; WordPress enqueues a single `frontend.js`).
 */

export type ThemePresetId = 'white' | 'angel' | 'cyber';

export interface ThemeTokens {
	background: string;
	surface: string;
	accent: string;
	accentMuted: string;
	text: string;
	textMuted: string;
	fontHeading: string;
	fontBody: string;
	radius: string;
}

const THEME_PRESETS: Record<ThemePresetId, ThemeTokens> = {
	white: {
		background: '#ffffff',
		surface: '#f8fafc',
		accent: '#0284c7',
		accentMuted: '#7dd3fc',
		text: '#0f172a',
		textMuted: '#64748b',
		fontHeading: 'ui-sans-serif, system-ui, sans-serif',
		fontBody: 'ui-sans-serif, system-ui, sans-serif',
		radius: '0.75rem',
	},
	angel: {
		background: '#fff7fb',
		surface: '#fff1f5',
		accent: '#db2777',
		accentMuted: '#fbcfe8',
		text: '#831843',
		textMuted: '#9d174d',
		fontHeading: 'Georgia, "Times New Roman", serif',
		fontBody: 'ui-sans-serif, system-ui, sans-serif',
		radius: '1rem',
	},
	cyber: {
		background: '#0a0a12',
		surface: '#12122a',
		accent: '#22d3ee',
		accentMuted: '#0891b2',
		text: '#e0f2fe',
		textMuted: '#94a3b8',
		fontHeading: '"JetBrains Mono", ui-monospace, monospace',
		fontBody: '"JetBrains Mono", ui-monospace, monospace',
		radius: '0.375rem',
	},
};

export function normalizeThemePreset( raw: unknown ): ThemePresetId {
	if ( raw === 'white' || raw === 'angel' || raw === 'cyber' ) {
		return raw;
	}
	return 'white';
}

function mergeThemeTokens(
	base: ThemeTokens,
	overrides: Partial<ThemeTokens>
): ThemeTokens {
	return {
		background: overrides.background ?? base.background,
		surface: overrides.surface ?? base.surface,
		accent: overrides.accent ?? base.accent,
		accentMuted: overrides.accentMuted ?? base.accentMuted,
		text: overrides.text ?? base.text,
		textMuted: overrides.textMuted ?? base.textMuted,
		fontHeading: overrides.fontHeading ?? base.fontHeading,
		fontBody: overrides.fontBody ?? base.fontBody,
		radius: overrides.radius ?? base.radius,
	};
}

export function resolveThemeFromRaw(
	raw: unknown,
	preset: ThemePresetId
): ThemeTokens {
	const base = THEME_PRESETS[ preset ];
	if ( ! raw || typeof raw !== 'object' ) {
		return { ...base };
	}
	const t = raw as Record<string, unknown>;
	const partial: Partial<ThemeTokens> = {};
	const keys: ( keyof ThemeTokens )[] = [
		'background',
		'surface',
		'accent',
		'accentMuted',
		'text',
		'textMuted',
		'fontHeading',
		'fontBody',
		'radius',
	];
	for ( const k of keys ) {
		const v = t[ k ];
		if ( typeof v === 'string' && v !== '' ) {
			partial[ k ] = v;
		}
	}
	return mergeThemeTokens( base, partial );
}
