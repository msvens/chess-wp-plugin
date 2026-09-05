<?php
/**
 * Server-side render for the Tournaments overview block.
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

// Which fields the cards and rows render. Defaults reproduce the output
// from before these toggles existed, so a block already on a page is
// unchanged. Sent as one JSON attribute rather than a data- attribute per
// field; parseFields() on the client re-applies the same defaults.
$rc_fields = [
	'showStatus'           => (bool) ( $attributes['showStatus'] ?? true ),
	'showCategory'         => (bool) ( $attributes['showCategory'] ?? true ),
	'showDates'            => (bool) ( $attributes['showDates'] ?? true ),
	'showDescription'      => (bool) ( $attributes['showDescription'] ?? true ),
	'showSsfBadge'         => (bool) ( $attributes['showSsfBadge'] ?? true ),
	'showLocation'         => (bool) ( $attributes['showLocation'] ?? false ),
	'showTimeControl'      => (bool) ( $attributes['showTimeControl'] ?? false ),
	'showParticipantCount' => (bool) ( $attributes['showParticipantCount'] ?? true ),
];

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-tournaments-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-locale="<?php echo esc_attr( determine_locale() ); ?>"
	data-ssf-base="<?php echo esc_url( untrailingslashit( rest_url( 'rockaden/v1/ssf' ) ) ); ?>"
	data-layout="<?php echo esc_attr( $rc_layout ); ?>"
	data-fields="<?php echo esc_attr( (string) wp_json_encode( $rc_fields ) ); ?>">
	<p><?php esc_html_e( 'Loading tournaments...', 'rockaden-chess' ); ?></p>
</div>
