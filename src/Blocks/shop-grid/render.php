<?php
/**
 * Server-side render for the Shop Items block.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

use Rockaden\Api\ShopApi;
use Rockaden\PostTypes\ShopItem;

$count      = isset( $attributes['count'] ) ? max( 1, (int) $attributes['count'] ) : 4;
$more_url   = (string) ( $attributes['moreUrl'] ?? '/schackmaterial' );
$more_label = (string) ( $attributes['moreLabel'] ?? __( 'Mer schackmaterial', 'rockaden-chess' ) );
$layout     = isset( $attributes['layout'] ) && 'column' === $attributes['layout'] ? 'column' : 'grid';

$shop_posts = get_posts(
	[
		'post_type'      => ShopItem::POST_TYPE,
		'post_status'    => 'publish',
		'posts_per_page' => $count,
		'orderby'        => 'menu_order date',
		'order'          => 'ASC',
	]
);

$items = array_map( [ ShopApi::class, 'format_item' ], $shop_posts );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'rockaden-shop-grid rockaden-shop-grid--' . $layout,
	]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<?php if ( empty( $items ) ) : ?>
		<p class="rockaden-shop-grid__empty"><?php esc_html_e( 'No shop items yet.', 'rockaden-chess' ); ?></p>
	<?php else : ?>
		<ul class="rockaden-shop-grid__list">
			<?php foreach ( $items as $item ) : ?>
				<li class="rockaden-shop-card">
					<?php if ( $item['imageUrl'] ) : ?>
						<div class="rockaden-shop-card__media">
							<img src="<?php echo esc_url( $item['imageUrl'] ); ?>" alt="<?php echo esc_attr( $item['imageAlt'] ?: $item['title'] ); ?>" loading="lazy" />
						</div>
					<?php endif; ?>
					<div class="rockaden-shop-card__body">
						<h3 class="rockaden-shop-card__title"><?php echo esc_html( $item['title'] ); ?></h3>
						<?php if ( $item['salePrice'] ) : ?>
							<p class="rockaden-shop-card__price">
								<s class="rockaden-shop-card__price-original"><?php echo esc_html( $item['price'] ); ?></s>
								<span class="rockaden-shop-card__price-sale"><?php echo esc_html( $item['salePrice'] ); ?></span>
							</p>
						<?php elseif ( $item['price'] ) : ?>
							<p class="rockaden-shop-card__price">
								<span><?php echo esc_html( $item['price'] ); ?></span>
							</p>
						<?php endif; ?>
						<?php if ( $item['buyUrl'] ) : ?>
							<a href="<?php echo esc_url( $item['buyUrl'] ); ?>" class="rockaden-shop-card__buy">
								<?php esc_html_e( 'Köp', 'rockaden-chess' ); ?>
							</a>
						<?php endif; ?>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>

	<?php if ( $more_url ) : ?>
		<p class="rockaden-shop-grid__more">
			<a href="<?php echo esc_url( $more_url ); ?>" class="rockaden-more-link">
				<?php echo esc_html( $more_label ); ?>
			</a>
		</p>
	<?php endif; ?>
</div>
