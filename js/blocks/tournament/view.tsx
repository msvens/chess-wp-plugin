/**
 * Frontend hydration for the Tournament detail block.
 */
import { createRoot } from '@wordpress/element';
import TournamentApp from './TournamentApp';
import '../training-group/training-group.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-tournament-block' )
	.forEach( ( el ) => {
		const tournamentId = Number( el.dataset.tournamentId ) || 0;
		const clubId = el.dataset.clubId || '';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		createRoot( el ).render(
			<TournamentApp
				tournamentId={ tournamentId }
				clubId={ clubId }
				locale={ locale }
			/>
		);
	} );
