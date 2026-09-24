/**
 * Front-end mount for the Chess Game block (and the [pgn] shortcode, which
 * renders the same markup). The server prints the PGN as text in a <pre>, so
 * the game stays readable without JavaScript; here it is swapped for the viewer.
 */
import 'lichess-pgn-viewer.css';
import 'chessground.brown.css';
import './chess-game.css';
import { getTranslation } from '../../shared/translations';
import {
	DEFAULT_CONFIG,
	mountGames,
	parseGames,
	type ChessGameConfig,
} from './mountGame';

function readConfig( el: HTMLElement ): ChessGameConfig {
	try {
		return {
			...DEFAULT_CONFIG,
			...JSON.parse( el.dataset.config || '{}' ),
		};
	} catch {
		return DEFAULT_CONFIG;
	}
}

document
	.querySelectorAll< HTMLElement >( '.rc-chess-game' )
	.forEach( ( el ) => {
		const source = el.querySelector( '.rc-chess-game__pgn' );
		const { games, error } = parseGames( source?.textContent || '' );
		if ( error ) {
			// Keep the raw PGN visible so readers still get the game text.
			const notice = document.createElement( 'p' );
			notice.className = 'rc-chess-game__error';
			notice.textContent = `${
				getTranslation().chessGame.readError
			} ${ error }`;
			el.prepend( notice );
			return;
		}
		mountGames( el, games, readConfig( el ) );
	} );
