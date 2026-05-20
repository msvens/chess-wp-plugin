<?php
/**
 * Server-side render for the Image Carousel block.
 *
 * Resolves the imageIds attribute to a list of URL/alt records and emits a
 * container the view script hydrates with React.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

$image_ids        = is_array( $attributes['imageIds'] ?? null ) ? $attributes['imageIds'] : [];
$display_mode     = in_array( $attributes['mode'] ?? '', [ 'slider', 'carousel' ], true ) ? $attributes['mode'] : 'slider';
$autoplay         = ! empty( $attributes['autoplay'] );
$autoplay_seconds = isset( $attributes['autoplayInterval'] ) ? max( 2, (int) $attributes['autoplayInterval'] ) : 5;
$visible_items    = isset( $attributes['visibleItems'] ) ? max( 2, min( 5, (int) $attributes['visibleItems'] ) ) : 3;
$aspect_ratio     = in_array( $attributes['aspectRatio'] ?? '', [ '16:9', '4:3', '1:1', '3:4', '9:16', 'auto' ], true ) ? $attributes['aspectRatio'] : '16:9';
$image_fit        = in_array( $attributes['imageFit'] ?? '', [ 'cover', 'contain' ], true ) ? $attributes['imageFit'] : 'contain';
$backdrop_style   = in_array( $attributes['backdropStyle'] ?? '', [ 'blurred', 'black' ], true ) ? $attributes['backdropStyle'] : 'blurred';
$constrain        = in_array( $attributes['constrain'] ?? '', [ 'none', 'width', 'height' ], true ) ? $attributes['constrain'] : 'none';
$constraint_value = isset( $attributes['constraintValue'] ) ? max( 0, (int) $attributes['constraintValue'] ) : 0;
$alignment        = in_array( $attributes['alignment'] ?? '', [ 'left', 'center', 'right' ], true ) ? $attributes['alignment'] : 'center';

$images = [];
foreach ( $image_ids as $raw_id ) {
	$attachment_id = (int) $raw_id;
	if ( ! $attachment_id ) {
		continue;
	}
	$src = wp_get_attachment_image_src( $attachment_id, 'large' );
	if ( ! $src ) {
		continue;
	}
	$alt      = (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
	$images[] = [
		'id'     => $attachment_id,
		'url'    => $src[0],
		'width'  => $src[1],
		'height' => $src[2],
		'alt'    => $alt,
	];
}

$config = [
	'images'           => $images,
	'mode'             => $display_mode,
	'autoplay'         => $autoplay,
	'autoplayInterval' => $autoplay_seconds,
	'visibleItems'     => $visible_items,
	'aspectRatio'      => $aspect_ratio,
	'imageFit'         => $image_fit,
	'backdropStyle'    => $backdrop_style,
	'constrain'        => $constrain,
	'constraintValue'  => $constraint_value,
	'alignment'        => $alignment,
];

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-carousel-block',
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>"
	data-locale="<?php echo esc_attr( determine_locale() ); ?>">
	<p class="rc-carousel__loading"><?php esc_html_e( 'Loading carousel…', 'rockaden-chess' ); ?></p>
</div>
