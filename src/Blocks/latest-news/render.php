<?php
/**
 * Server-side render for the Latest News block.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

$count      = isset( $attributes['count'] ) ? max( 1, (int) $attributes['count'] ) : 3;
$more_url   = (string) ( $attributes['moreUrl'] ?? '/nyheter' );
$more_label = (string) ( $attributes['moreLabel'] ?? __( 'Mer nyheter', 'rockaden-chess' ) );

$news_posts = get_posts(
	[
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => $count,
	]
);

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'rockaden-latest-news' ] );
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<?php if ( empty( $news_posts ) ) : ?>
		<p class="rockaden-latest-news__empty"><?php esc_html_e( 'No news yet.', 'rockaden-chess' ); ?></p>
	<?php else : ?>
		<ul class="rockaden-latest-news__list">
			<?php foreach ( $news_posts as $news_post ) : ?>
				<?php
				$thumb_id  = (int) get_post_thumbnail_id( $news_post->ID );
				$thumb_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '';
				$thumb_alt = $thumb_id ? get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) : '';
				$permalink = get_permalink( $news_post );
				$excerpt   = get_the_excerpt( $news_post );
				$date      = get_the_date( '', $news_post );
				?>
				<li class="rockaden-news-card">
					<?php if ( $thumb_url ) : ?>
						<a href="<?php echo esc_url( $permalink ); ?>" class="rockaden-news-card__media">
							<img src="<?php echo esc_url( $thumb_url ); ?>" alt="<?php echo esc_attr( $thumb_alt ?: $news_post->post_title ); ?>" loading="lazy" />
						</a>
					<?php endif; ?>
					<div class="rockaden-news-card__body">
						<h3 class="rockaden-news-card__title">
							<a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $news_post->post_title ); ?></a>
						</h3>
						<p class="rockaden-news-card__date"><?php echo esc_html( $date ); ?></p>
						<?php if ( $excerpt ) : ?>
							<p class="rockaden-news-card__excerpt"><?php echo esc_html( $excerpt ); ?></p>
						<?php endif; ?>
						<a href="<?php echo esc_url( $permalink ); ?>" class="rockaden-news-card__more">
							<?php esc_html_e( 'Läs mer', 'rockaden-chess' ); ?>
						</a>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>

	<?php if ( $more_url ) : ?>
		<p class="rockaden-latest-news__more">
			<a href="<?php echo esc_url( $more_url ); ?>" class="rockaden-more-link">
				<?php echo esc_html( $more_label ); ?>
			</a>
		</p>
	<?php endif; ?>
</div>
