/**
 * Frontend hydration for the standalone Standings block.
 */
import { createRoot } from '@wordpress/element';
import { configureSsf } from '../../shared/ssf';
import StandingsApp from './StandingsApp';
import './standings.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-standings-block' )
	.forEach( ( el ) => {
		configureSsf( el.dataset.ssfBase || '' );
		const tournamentId = Number( el.dataset.tournamentId ) || 0;
		const clubId = el.dataset.clubId || '';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		const showRounds = el.dataset.showRounds !== 'false';
		createRoot( el ).render(
			<StandingsApp
				tournamentId={ tournamentId }
				clubId={ clubId }
				locale={ locale }
				showRounds={ showRounds }
			/>
		);
	} );
