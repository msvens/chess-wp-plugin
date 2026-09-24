<?php
/**
 * [pgn]…[/pgn] shortcode — compatibility with the Embed Chessboard plugin.
 *
 * @package Rockaden
 */

namespace Rockaden\Blocks;

/**
 * Renders Embed Chessboard's [pgn] shortcode through the Chess Game block, so
 * posts written for that plugin keep working once it is deactivated.
 *
 * The editor's "convert to block" transforms (js/blocks/chess-game/shortcode.ts)
 * apply the same option mapping — keep the two in step.
 */
class ChessGameShortcode {

	public const TAG = 'pgn';

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'init', [ self::class, 'add_shortcode' ], 20 );
	}

	/**
	 * Claim [pgn] unless another plugin already has it. Embed Chessboard adds
	 * its handler on plugins_loaded, so while it is active it keeps rendering
	 * its own shortcodes and the two plugins never fight over the tag.
	 */
	public static function add_shortcode(): void {
		if ( shortcode_exists( self::TAG ) ) {
			return;
		}
		add_shortcode( self::TAG, [ self::class, 'render' ] );
		add_filter( 'no_texturize_shortcodes', [ self::class, 'no_texturize' ] );
	}

	/**
	 * Keep wptexturize from turning PGN quotes into curly ones.
	 *
	 * @param array<int, string> $shortcodes Shortcodes exempt from texturizing.
	 * @return array<int, string>
	 */
	public static function no_texturize( array $shortcodes ): array {
		$shortcodes[] = self::TAG;
		return $shortcodes;
	}

	/**
	 * Shortcode callback.
	 *
	 * @param array<int|string, string>|string $atts    Attributes (names already lower-cased by WordPress).
	 * @param string|null                      $content The PGN.
	 */
	public static function render( $atts, $content = null ): string {
		$pgn = self::clean_pgn( (string) $content );
		if ( '' === $pgn ) {
			return '';
		}

		return render_block(
			[
				'blockName'    => 'rockaden/chess-game',
				'attrs'        => array_merge( [ 'pgn' => $pgn ], self::map_options( is_array( $atts ) ? $atts : [] ) ),
				'innerBlocks'  => [],
				'innerHTML'    => '',
				'innerContent' => [],
			]
		);
	}

	/**
	 * WordPress runs wpautop over classic content and the Shortcode block, so
	 * the PGN arrives with <br />/<p> tags and HTML entities in it. A <br />
	 * already sits before its newline — turning it into another newline would
	 * put blank lines between header tags, which PGN reads as a new section.
	 *
	 * @param string $content Shortcode content as stored.
	 */
	public static function clean_pgn( string $content ): string {
		$text = (string) preg_replace( '#<br\s*/?>[ \t]*\r?\n?#i', "\n", $content );
		$text = (string) preg_replace( '#</p>\s*<p[^>]*>#i', "\n\n", $text );
		$text = wp_strip_all_tags( $text );
		return trim( html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	}

	/**
	 * Embed Chessboard options → block attributes. Options without an
	 * equivalent (height, initialVariation, autoplayMode, extendedOptions, …)
	 * are dropped; the viewer sizes itself.
	 *
	 * @param array<int|string, string> $atts Shortcode attributes, long or short names.
	 * @return array<string, string|bool>
	 */
	public static function map_options( array $atts ): array {
		$opts = [];
		foreach ( $atts as $key => $value ) {
			if ( is_string( $key ) ) {
				$opts[ strtolower( $key ) ] = strtolower( trim( (string) $value ) );
			}
		}
		$pick = static fn ( string $long, string $short ): string => $opts[ $long ] ?? $opts[ $short ] ?? '';

		$attributes = [];

		$halfmove = $pick( 'initialhalfmove', 'ih' );
		if ( 'end' === $halfmove ) {
			$attributes['initialPly'] = 'last';
		} elseif ( ctype_digit( $halfmove ) ) {
			$attributes['initialPly'] = $halfmove;
		}

		$moves = $pick( 'showmoves', 'sm' );
		if ( 'puzzle' === $moves || 'p' === $moves ) {
			$attributes['puzzle'] = true;
		} elseif ( 'hidden' === $moves || 'h' === $moves ) {
			$attributes['showMoves'] = 'none';
		}

		$layout = $pick( 'layout', 'l' );
		if ( ! isset( $attributes['puzzle'] ) && ! isset( $attributes['showMoves'] ) ) {
			if ( 'horizontal' === $layout || 'h' === $layout ) {
				$attributes['showMoves'] = 'right';
			} elseif ( 'vertical' === $layout || 'v' === $layout ) {
				$attributes['showMoves'] = 'bottom';
			}
		}

		return $attributes;
	}
}
