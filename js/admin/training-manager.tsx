import { createRoot } from '@wordpress/element';
import type { Language } from '../shared';
import type { AppConfig } from './types';
import { TrainingApp } from './components/TrainingApp';

declare global {
	interface Window {
		rockadenTraining: {
			restUrl: string;
			nonce: string;
			locale: string;
			clubId: string;
		};
	}
}

function deriveLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

const rootEl = document.getElementById( 'rockaden-training-root' );
if ( rootEl ) {
	const raw = window.rockadenTraining;
	const config: AppConfig = {
		restUrl: raw.restUrl,
		nonce: raw.nonce,
		locale: raw.locale,
		clubId: raw.clubId,
		language: deriveLanguage( raw.locale ),
	};

	createRoot( rootEl ).render( <TrainingApp config={ config } /> );
}
