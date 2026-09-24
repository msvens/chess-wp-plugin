/**
 * Shared by the front-end view and the editor preview: splits a PGN into
 * games, checks them, and mounts the Lichess viewer (with a game selector when
 * the PGN holds more than one game).
 */
import LichessPgnViewer from '@lichess-org/pgn-viewer';
import type PgnViewer from '@lichess-org/pgn-viewer/pgnViewer';
import type { Opts } from '@lichess-org/pgn-viewer/interfaces';
import {
	makePgn,
	parsePgn,
	startingPosition,
	type Game,
	type PgnNodeData,
} from 'chessops/pgn';
import { parseSan } from 'chessops/san';
import { getTranslation } from '../../shared/translations';
import { attachGameMenu, type GameMenu } from './gameMenu';

export type Orientation = 'auto' | 'white' | 'black';
export type MoveList = 'auto' | 'right' | 'bottom' | 'none';

/** The block attributes that shape the viewer (everything except `pgn`). */
export interface ChessGameConfig {
	orientation: Orientation;
	initialPly: string;
	showMoves: MoveList;
	puzzle: boolean;
	lichessLinks: boolean;
}

export const DEFAULT_CONFIG: ChessGameConfig = {
	orientation: 'auto',
	initialPly: '0',
	showMoves: 'auto',
	puzzle: false,
	lichessLinks: true,
};

export interface ParsedPgn {
	games: Game< PgnNodeData >[];
	/** First problem found, already translated; null when every game is playable. */
	error: string | null;
}

/**
 * Parse and validate. chessops' parser is lenient and never throws, so we
 * replay each mainline to catch illegal or misspelled moves — otherwise the
 * viewer silently stops at the first bad move.
 *
 * @param pgn Raw PGN text, possibly several games.
 */
export function parseGames( pgn: string ): ParsedPgn {
	const t = getTranslation().chessGame;
	// chessops fills in default headers, so any text parses as "a game";
	// only a game with moves, or a set-up position, is worth a board.
	const games = parsePgn( pgn ).filter(
		( game ) => game.moves.children.length > 0 || game.headers.has( 'FEN' )
	);
	if ( ! games.length ) {
		return { games, error: pgn.trim() ? t.noGames : null };
	}
	for ( const [ index, game ] of games.entries() ) {
		const gameNo = String( index + 1 );
		const start = startingPosition( game.headers );
		if ( start.isErr ) {
			return {
				games,
				error: t.invalidStart.replace( '{game}', gameNo ),
			};
		}
		const pos = start.value;
		for ( const node of game.moves.mainline() ) {
			const move = parseSan( pos, node.san );
			if ( ! move ) {
				const moveNo = `${ pos.fullmoves }${
					pos.turn === 'white' ? '.' : '...'
				} ${ node.san }`;
				return {
					games,
					error: t.illegalMove
						.replace( '{game}', gameNo )
						.replace( '{move}', moveNo ),
				};
			}
			pos.play( move );
		}
	}
	return { games, error: null };
}

/**
 * Label for the game selector: "White – Black (Event, Date)".
 *
 * @param game A parsed game.
 */
function gameLabel( game: Game< PgnNodeData > ): string {
	const tag = ( name: string ) => {
		const value = game.headers.get( name );
		return value && value !== '?' ? value : '';
	};
	const players = `${ tag( 'White' ) || '?' } – ${ tag( 'Black' ) || '?' }`;
	const date = tag( 'Date' ).replace( /\.\?\?/g, '' );
	const extra = [ tag( 'Event' ), date ].filter( Boolean ).join( ', ' );
	return extra ? `${ players } (${ extra })` : players;
}

/**
 * Below this block width a move list beside the board squeezes the board too
 * much, so "auto" puts it underneath. Beside is preferred whenever it fits:
 * underneath makes the viewer taller than a laptop screen. The viewer's own
 * "auto" goes by window width (a 450px media query), which misreads a narrow
 * post column.
 */
const MOVES_BESIDE_MIN_WIDTH = 460;

function viewerOptions(
	pgn: string,
	config: ChessGameConfig,
	full: boolean,
	width: number
): Partial< Opts > {
	const viewerStrings = getTranslation().chessGame.viewer;
	const initialPly =
		config.initialPly === 'last'
			? 'last'
			: Math.max( 0, parseInt( config.initialPly, 10 ) || 0 );
	return {
		pgn,
		orientation:
			config.orientation === 'auto' ? undefined : config.orientation,
		initialPly,
		showMoves: full ? fullMoveList( config, width ) : false,
		// A puzzle hides who played until the reader asks for the full view.
		showPlayers: config.puzzle && ! full ? false : 'auto',
		// The default scroll-wheel stepping hijacks page scrolling.
		scrollToMove: false,
		translate: ( key: string ) => viewerStrings[ key ],
	};
}

/**
 * Where the move list goes in the full view. For a puzzle or a hidden list
 * (the author's starting view) this is where it goes once a reader asks for it.
 *
 * @param config Display options.
 * @param width  Block width in pixels, 0 when not laid out yet.
 */
function fullMoveList(
	config: ChessGameConfig,
	width: number
): Exclude< MoveList, 'none' > {
	const choice =
		config.puzzle || config.showMoves === 'none'
			? 'auto'
			: config.showMoves;
	if ( choice === 'auto' && width > 0 ) {
		return width >= MOVES_BESIDE_MIN_WIDTH ? 'right' : 'bottom';
	}
	return choice;
}

export interface MountedGame {
	/** The viewer showing the selected game (for "use the position shown"). */
	viewer: () => PgnViewer | undefined;
}

/**
 * Render the games into `root`, replacing its content.
 *
 * @param root   Container element (front-end block wrapper or editor preview).
 * @param games  Games from parseGames().
 * @param config Display options.
 */
export function mountGames(
	root: HTMLElement,
	games: Game< PgnNodeData >[],
	config: ChessGameConfig
): MountedGame {
	const doc = root.ownerDocument;
	root.replaceChildren();
	let current: PgnViewer | undefined;
	let gameIndex = 0;
	// The author's choice decides the starting view; readers can switch it.
	let full = ! config.puzzle && config.showMoves !== 'none';

	const board = doc.createElement( 'div' );
	board.className = 'rc-chess-game__board';

	const show = ( keepPosition = false ) => {
		const previous = keepPosition ? current : undefined;
		menu?.close();
		const width = root.getBoundingClientRect().width;
		const options = viewerOptions(
			makePgn( games[ gameIndex ] ),
			config,
			full,
			width
		);
		// The stylesheet sizes the board by layout.
		root.dataset.layout = options.showMoves || 'none';
		// The viewer has no destroy(); it takes over a fresh element each time.
		const target = doc.createElement( 'div' );
		board.replaceChildren( target );
		current = LichessPgnViewer( target, options );
		if ( previous ) {
			current.toPath( previous.path );
			if ( previous.flipped ) {
				current.flip();
			}
		}
	};

	if ( games.length > 1 ) {
		const select = doc.createElement( 'select' );
		select.className = 'rc-chess-game__select';
		select.setAttribute( 'aria-label', getTranslation().chessGame.game );
		games.forEach( ( game, index ) => {
			const option = doc.createElement( 'option' );
			option.value = String( index );
			option.textContent = `${ index + 1 }. ${ gameLabel( game ) }`;
			select.appendChild( option );
		} );
		select.addEventListener( 'change', () => {
			gameIndex = Number( select.value );
			show();
		} );
		root.appendChild( select );
	}

	root.appendChild( board );
	const menu: GameMenu | undefined = attachGameMenu( root, board, {
		viewer: () => current,
		isFull: () => full,
		toggleFull: () => {
			full = ! full;
			show( true );
		},
		lichessLinks: config.lichessLinks,
	} );
	show();
	return { viewer: () => current };
}
