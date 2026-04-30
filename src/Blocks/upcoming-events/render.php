<?php
/**
 * Server-side render for the Upcoming Events block.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

use Rockaden\Services\EventExpander;

$count      = isset( $attributes['count'] ) ? max( 1, (int) $attributes['count'] ) : 4;
$more_url   = (string) ( $attributes['moreUrl'] ?? '/kalender' );
$more_label = (string) ( $attributes['moreLabel'] ?? __( 'Se hela kalendern', 'rockaden-chess' ) );

$occurrences = EventExpander::get_upcoming( $count );

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'rockaden-upcoming-events' ] );

$tz          = wp_timezone();
$time_format = get_option( 'time_format', 'H:i' );
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<?php if ( empty( $occurrences ) ) : ?>
		<p class="rockaden-upcoming-events__empty"><?php esc_html_e( 'No upcoming events.', 'rockaden-chess' ); ?></p>
	<?php else : ?>
		<ul class="rockaden-upcoming-events__list">
			<?php foreach ( $occurrences as $occ ) : ?>
				<?php
				$start    = new \DateTime( $occ['startDate'], $tz );
				$category = $occ['category'] ?: 'other';
				?>
				<li class="rockaden-event-card rockaden-event-card--<?php echo esc_attr( $category ); ?>">
					<div class="rockaden-event-card__date">
						<span class="rockaden-event-card__day"><?php echo esc_html( $start->format( 'j' ) ); ?></span>
						<span class="rockaden-event-card__month"><?php echo esc_html( $start->format( 'M' ) ); ?></span>
					</div>
					<div class="rockaden-event-card__body">
						<h3 class="rockaden-event-card__title"><?php echo esc_html( $occ['title'] ); ?></h3>
						<p class="rockaden-event-card__time">
							<?php echo esc_html( wp_date( $time_format, $start->getTimestamp() ) ); ?>
							<?php if ( $occ['location'] ) : ?>
								· <?php echo esc_html( $occ['location'] ); ?>
							<?php endif; ?>
						</p>
						<?php if ( $occ['link'] ) : ?>
							<a class="rockaden-event-card__link" href="<?php echo esc_url( $occ['link'] ); ?>">
								<?php echo esc_html( $occ['linkLabel'] ?: __( 'Mer info', 'rockaden-chess' ) ); ?>
							</a>
						<?php endif; ?>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>

	<?php if ( $more_url ) : ?>
		<p class="rockaden-upcoming-events__more">
			<a href="<?php echo esc_url( $more_url ); ?>" class="rockaden-more-link">
				<?php echo esc_html( $more_label ); ?>
			</a>
		</p>
	<?php endif; ?>
</div>
