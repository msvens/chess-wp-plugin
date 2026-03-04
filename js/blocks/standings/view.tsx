/**
 * Frontend hydration for the standalone Standings block.
 */
import { createRoot } from '@wordpress/element';
import StandingsApp from './StandingsApp';
import './standings.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-standings-block' )
	.forEach( ( el ) => {
		const groupId = Number( el.dataset.groupId ) || 0;
		const clubId = el.dataset.clubId || '';
		const locale = el.dataset.locale || 'sv';
		createRoot( el ).render(
			<StandingsApp
				groupId={ groupId }
				clubId={ clubId }
				locale={ locale }
			/>
		);
	} );
