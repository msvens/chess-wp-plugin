<?php
/**
 * Server-side render for the Ranking List block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$club_id = get_option( 'rockaden_ssf_club_id', '' );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-ranking-list-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-club-id="<?php echo esc_attr( (string) $club_id ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p><?php esc_html_e( 'Loading ranking list...', 'rockaden-chess' ); ?></p>
</div>
