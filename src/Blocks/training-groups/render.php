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

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-training-groups-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p><?php esc_html_e( 'Loading training groups...', 'rockaden-chess' ); ?></p>
</div>
