<?php
/**
 * Server-side render for the QR Code block.
 * Outputs the code's address; the view script draws the code into the tile.
 * The address is read from the saved code at render time, so changing a code
 * updates every page that shows it.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

use Rockaden\PostTypes\QrCode;

defined( 'ABSPATH' ) || exit;

$qr_post = get_post( (int) ( $attributes['qrCodeId'] ?? 0 ) );
if ( ! $qr_post || QrCode::POST_TYPE !== $qr_post->post_type || 'publish' !== $qr_post->post_status ) {
	return;
}

$qr_url = (string) get_post_meta( $qr_post->ID, QrCode::META_URL, true );
if ( '' === $qr_url ) {
	return;
}

$qr_size    = max( 100, min( 400, (int) ( $attributes['size'] ?? 200 ) ) );
$qr_caption = (string) ( $attributes['caption'] ?? 'none' );
$qr_text    = '';
if ( 'name' === $qr_caption ) {
	$qr_text = get_the_title( $qr_post );
} elseif ( 'url' === $qr_caption ) {
	$qr_text = $qr_url;
}

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-qr-code-block',
		'style' => '--rc-qr-size: ' . $qr_size . 'px;',
	]
);
?>
<figure <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<div class="rc-qr__code" data-url="<?php echo esc_url( $qr_url ); ?>" role="img"
		aria-label="<?php echo esc_attr( sprintf( /* translators: %s: the address the QR code points to */ __( 'QR code: %s', 'rockaden-chess' ), $qr_url ) ); ?>"></div>
	<?php if ( '' !== $qr_text ) : ?>
		<figcaption class="rc-qr__caption"><?php echo esc_html( $qr_text ); ?></figcaption>
	<?php endif; ?>
</figure>
