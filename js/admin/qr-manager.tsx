import './admin-common.css';
import './qr-manager.css';
import { createRoot } from '@wordpress/element';
import type { Language } from '../shared';
import { QrApp } from './components/qr/QrApp';

declare global {
	interface Window {
		rockadenQr: {
			siteUrl: string;
			locale: string;
		};
	}
}

function deriveLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

const rootEl = document.getElementById( 'rockaden-qr-root' );
if ( rootEl ) {
	const raw = window.rockadenQr;
	createRoot( rootEl ).render(
		<QrApp
			siteUrl={ raw.siteUrl }
			language={ deriveLanguage( raw.locale ) }
		/>
	);
}
