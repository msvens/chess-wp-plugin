<?php
/**
 * Server-side render for the Standings block.
 * Outputs a container that the view script hydrates with React.
 *
 * On a singular `rc_tournament` page, the tournamentId defaults to the
 * current post (so the block can be dropped into the tournament template
 * without per-post configuration).
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$tournament_id = (int) ( $attributes['tournamentId'] ?? 0 );
if ( 0 === $tournament_id && is_singular( 'rc_tournament' ) ) {
	$tournament_id = get_the_ID();
}

$club_id     = get_option( 'rockaden_ssf_club_id', '' );
$show_rounds = ! empty( $attributes['showRounds'] ) ? 'true' : 'false';

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-standings-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-tournament-id="<?php echo esc_attr( (string) $tournament_id ); ?>"
	data-club-id="<?php echo esc_attr( (string) $club_id ); ?>"
	data-ssf-base="<?php echo esc_url( untrailingslashit( rest_url( 'rockaden/v1/ssf' ) ) ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>"
	data-show-rounds="<?php echo esc_attr( $show_rounds ); ?>">
	<p><?php esc_html_e( 'Loading standings...', 'rockaden-chess' ); ?></p>
</div>
