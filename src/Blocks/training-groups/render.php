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

// Which fields the cards and rows render. Defaults reproduce the output
// from before these toggles existed, so a block already on a page is
// unchanged. Sent as one JSON attribute rather than a data- attribute per
// field; parseFields() on the client re-applies the same defaults.
$rc_fields = [
	'showDescription'      => (bool) ( $attributes['showDescription'] ?? true ),
	'showSchedule'         => (bool) ( $attributes['showSchedule'] ?? true ),
	'showSemester'         => (bool) ( $attributes['showSemester'] ?? true ),
	'showLocation'         => (bool) ( $attributes['showLocation'] ?? false ),
	'showTrainers'         => (bool) ( $attributes['showTrainers'] ?? false ),
	'showContact'          => (bool) ( $attributes['showContact'] ?? false ),
	'showStatus'           => (bool) ( $attributes['showStatus'] ?? false ),
	'showParticipantCount' => (bool) ( $attributes['showParticipantCount'] ?? true ),
];

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-training-groups-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-locale="<?php echo esc_attr( determine_locale() ); ?>"
	data-layout="<?php echo esc_attr( $rc_layout ); ?>"
	data-fields="<?php echo esc_attr( (string) wp_json_encode( $rc_fields ) ); ?>">
	<p><?php esc_html_e( 'Loading training groups...', 'rockaden-chess' ); ?></p>
</div>
