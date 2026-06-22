<?php
/**
 * Server-side render for the Training Groups overview block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$rc_layout = isset( $attributes['layout'] ) && 'list' === $attributes['layout'] ? 'list' : 'cards';

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-training-groups-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-can-edit="<?php echo current_user_can( 'edit_posts' ) ? '1' : '0'; ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>"
	data-layout="<?php echo esc_attr( $rc_layout ); ?>">
	<p><?php esc_html_e( 'Loading training groups...', 'rockaden-chess' ); ?></p>
</div>
