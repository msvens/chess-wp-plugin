<?php
/**
 * Server-side render for the Standings block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$group_id    = $attributes['groupId'] ?? 0;
$club_id     = get_option( 'rockaden_ssf_club_id', '' );
$show_rounds = ! empty( $attributes['showRounds'] ) ? 'true' : 'false';

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-standings-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-group-id="<?php echo esc_attr( (string) $group_id ); ?>"
	data-club-id="<?php echo esc_attr( (string) $club_id ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>"
	data-show-rounds="<?php echo esc_attr( $show_rounds ); ?>">
	<p><?php esc_html_e( 'Loading standings...', 'rockaden-chess' ); ?></p>
</div>
