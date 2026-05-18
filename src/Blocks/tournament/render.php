<?php
/**
 * Server-side render for the Tournament detail block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$tournament_id = $attributes['tournamentId'] ?? 0;

// When used in a single-rc_tournament template, auto-detect tournament ID.
if ( ! $tournament_id && is_singular( 'rc_tournament' ) ) {
	$tournament_id = get_the_ID();
}

$club_id = get_option( 'rockaden_ssf_club_id', '' );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-tournament-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-tournament-id="<?php echo esc_attr( (string) $tournament_id ); ?>"
	data-club-id="<?php echo esc_attr( (string) $club_id ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p><?php esc_html_e( 'Loading tournament...', 'rockaden-chess' ); ?></p>
</div>
