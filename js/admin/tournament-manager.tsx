import './tournament-manager.css';
import { createRoot } from '@wordpress/element';
import type { Language } from '../shared';
import type { AppConfig } from './types';
import { TournamentApp } from './components/tournament/TournamentApp';

declare global {
	interface Window {
		rockadenTournament: {
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

const rootEl = document.getElementById( 'rockaden-tournament-root' );
if ( rootEl ) {
	const raw = window.rockadenTournament;
	const config: AppConfig = {
		restUrl: raw.restUrl,
		nonce: raw.nonce,
		locale: raw.locale,
		clubId: raw.clubId,
		language: deriveLanguage( raw.locale ),
	};

	createRoot( rootEl ).render( <TournamentApp config={ config } /> );
}
