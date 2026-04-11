import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Multi-entry: `admin` and `frontend` emit separate JS/CSS bundles.
 */
const pluginRootAssets = path.resolve( __dirname, '../assets' );

export default defineConfig( {
	plugins: [ react() ],
	base: './',
	build: {
		outDir: pluginRootAssets,
		emptyOutDir: false,
		cssCodeSplit: true,
		rollupOptions: {
			input: {
				admin: path.resolve( __dirname, 'src/main.tsx' ),
				frontend: path.resolve( __dirname, 'src/frontend.tsx' ),
			},
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: 'chunks/[name].js',
				manualChunks( id ) {
					const norm = id.split( '\\' ).join( '/' );
					if ( norm.includes( 'node_modules' ) ) {
						return 'mebuki-vendor';
					}
					// Shared by admin + frontend (`toFormState`); stable chunk name for WP enqueue.
					if ( norm.includes( 'mergeSettings' ) ) {
						return 'mebuki-settings';
					}
				},
				assetFileNames: ( assetInfo ) => {
					const names = assetInfo.names ?? [];
					const fromNames = names.some( ( n ) => typeof n === 'string' && n.endsWith( '.css' ) );
					const fromFile =
						typeof assetInfo.name === 'string' && assetInfo.name.endsWith( '.css' );
					if ( fromNames || fromFile ) {
						const base =
							names.find( ( n ) => typeof n === 'string' && n.endsWith( '.css' ) ) ??
							assetInfo.name ??
							'';
						const stem = typeof base === 'string' ? base.replace( /\.css$/i, '' ) : '';
						if ( stem === 'admin' || stem === 'frontend' ) {
							return `${ stem }[extname]`;
						}
						return '[name][extname]';
					}
					return '[name][extname]';
				},
			},
		},
	},
} );
