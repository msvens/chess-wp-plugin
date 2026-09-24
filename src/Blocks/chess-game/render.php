<?php
/**
 * Server-side render for the Chess Game block (also used by the [pgn]
 * shortcode through render_block()).
 *
 * Prints the PGN as plain text in a <pre> — readable without JavaScript, in
 * feeds and for search engines — plus the display options as JSON. The view
 * script replaces it with the interactive viewer.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$pgn = trim( (string) ( $attributes['pgn'] ?? '' ) );
if ( '' === $pgn ) {
	return;
}

$config = [
	'orientation'  => (string) ( $attributes['orientation'] ?? 'auto' ),
	'initialPly'   => (string) ( $attributes['initialPly'] ?? '0' ),
	'showMoves'    => (string) ( $attributes['showMoves'] ?? 'auto' ),
	'puzzle'       => ! empty( $attributes['puzzle'] ),
	'lichessLinks' => ! isset( $attributes['lichessLinks'] ) || (bool) $attributes['lichessLinks'],
];

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'rc-chess-game' ] );
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-config="<?php echo esc_attr( (string) wp_json_encode( $config ) ); ?>">
	<pre class="rc-chess-game__pgn"><?php echo esc_html( $pgn ); ?></pre>
</div>
