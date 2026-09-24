/**
 * Maps Embed Chessboard's `[pgn …]…[/pgn]` shortcode onto Chess Game block
 * attributes, for the editor's "convert to block" transforms. Mirrors
 * Rockaden\Blocks\ChessGameShortcode (PHP), which renders the same shortcode
 * on the front end — keep the two in step.
 */
import type { ChessGameConfig } from './mountGame';

export type ChessGameAttributes = ChessGameConfig & { pgn: string };

/**
 * WordPress runs wpautop over classic content and the Shortcode block, so the
 * PGN arrives with <br />/<p> tags and HTML entities in it. A <br /> already
 * sits before its newline — turning it into another newline would put blank
 * lines between header tags, which PGN reads as a new section.
 *
 * @param content Shortcode content as stored.
 */
export function cleanPgn( content: string ): string {
	const text = content
		.replace( /<br\s*\/?>[ \t]*\r?\n?/gi, '\n' )
		.replace( /<\/p>\s*<p[^>]*>/gi, '\n\n' )
		.replace( /<[^>]*>/g, '' );
	const decoder = document.createElement( 'textarea' );
	decoder.innerHTML = text;
	return decoder.value.trim();
}

/**
 * Embed Chessboard options → block attributes. Options without an equivalent
 * (height, initialVariation, autoplayMode, extendedOptions, …) are dropped.
 *
 * @param named   Shortcode attributes, any case, long or short names.
 * @param content Shortcode content (the PGN).
 */
export function attributesFromShortcode(
	named: Record< string, string >,
	content: string
): Partial< ChessGameAttributes > {
	const opts: Record< string, string > = {};
	for ( const [ key, value ] of Object.entries( named ) ) {
		opts[ key.toLowerCase() ] = String( value ).toLowerCase();
	}
	const pick = ( long: string, short: string ) =>
		opts[ long ] ?? opts[ short ];

	const attributes: Partial< ChessGameAttributes > = {
		pgn: cleanPgn( content ),
	};

	const halfmove = pick( 'initialhalfmove', 'ih' );
	if ( halfmove === 'end' ) {
		attributes.initialPly = 'last';
	} else if ( halfmove && /^\d+$/.test( halfmove ) ) {
		attributes.initialPly = halfmove;
	}

	const moves = pick( 'showmoves', 'sm' );
	if ( moves === 'puzzle' || moves === 'p' ) {
		attributes.puzzle = true;
	} else if ( moves === 'hidden' || moves === 'h' ) {
		attributes.showMoves = 'none';
	}

	const layout = pick( 'layout', 'l' );
	if ( ! attributes.puzzle && ! attributes.showMoves ) {
		if ( layout === 'horizontal' || layout === 'h' ) {
			attributes.showMoves = 'right';
		} else if ( layout === 'vertical' || layout === 'v' ) {
			attributes.showMoves = 'bottom';
		}
	}

	return attributes;
}
