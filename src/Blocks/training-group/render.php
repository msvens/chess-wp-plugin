<?php
/**
 * Server-side render for the Training Group detail block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$group_id = $attributes['groupId'] ?? 0;

// When used in a single-rc_training_group template, auto-detect group ID.
if ( ! $group_id && is_singular( 'rc_training_group' ) ) {
	$group_id = get_the_ID();
}

$club_id = get_option( 'rockaden_ssf_club_id', '' );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-training-group-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-group-id="<?php echo esc_attr( (string) $group_id ); ?>"
	data-club-id="<?php echo esc_attr( (string) $club_id ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p><?php esc_html_e( 'Loading training group...', 'rockaden-chess' ); ?></p>
</div>
