<?php
/**
 * Server-side render for the Today block.
 * Outputs a container that the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$district_id  = (int) ( $attributes['districtId'] ?? 0 );
$show_heading = ( $attributes['showHeading'] ?? true ) ? 'true' : 'false';
$show_note    = ( $attributes['showNote'] ?? true ) ? 'true' : 'false';

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-today-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-district-id="<?php echo esc_attr( (string) $district_id ); ?>"
	data-show-heading="<?php echo esc_attr( $show_heading ); ?>"
	data-show-note="<?php echo esc_attr( $show_note ); ?>"
	data-ssf-base="<?php echo esc_url( untrailingslashit( rest_url( 'rockaden/v1/ssf' ) ) ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p><?php esc_html_e( 'Loading tournaments...', 'rockaden-chess' ); ?></p>
</div>
