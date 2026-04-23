import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const mount = document.getElementById( 'mebuki-admin-root' );

if ( mount ) {
	document.body.classList.add( 'mebuki-portfolio-page' );
	const hideThemeChrome = () => {
		const selectors = [
			'header',
			'footer',
			'#masthead',
			'.site-header',
			'.l-header',
			'[role="banner"]',
		];
		document.querySelectorAll< HTMLElement >( selectors.join( ',' ) ).forEach( ( el ) => {
			el.style.display = 'none';
		} );
	};

	const applyViewportVars = () => {
		const scrollbarWidth = Math.max(
			window.innerWidth - document.documentElement.clientWidth,
			0
		);
		document.documentElement.style.setProperty(
			'--mebuki-scrollbar-width',
			`${ scrollbarWidth }px`
		);
		document.documentElement.style.setProperty(
			'--mebuki-safe-vw',
			`calc(100vw - ${ scrollbarWidth }px)`
		);
	};
	applyViewportVars();
	hideThemeChrome();
	window.addEventListener( 'resize', applyViewportVars );

	createRoot( mount ).render(
		<StrictMode>
			<App />
		</StrictMode>
	);
}
