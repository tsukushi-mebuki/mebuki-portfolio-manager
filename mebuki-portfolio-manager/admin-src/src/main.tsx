import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const mount = document.getElementById( 'mebuki-admin-root' );

if ( mount ) {
	createRoot( mount ).render(
		<StrictMode>
			<App />
		</StrictMode>
	);
}
