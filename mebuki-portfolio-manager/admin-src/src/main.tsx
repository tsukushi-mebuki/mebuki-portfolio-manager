import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const mount = document.getElementById( 'mebuki-admin-root' );

if ( mount ) {
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
	window.addEventListener( 'resize', applyViewportVars );

	createRoot( mount ).render(
		<StrictMode>
			<App />
		</StrictMode>
	);
}
