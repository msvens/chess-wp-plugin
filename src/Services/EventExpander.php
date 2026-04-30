<?php
/**
 * Event recurring-expansion helper.
 *
 * @package Rockaden
 */

namespace Rockaden\Services;

use Rockaden\PostTypes\Event;

/**
 * Reads rc_event posts, formats them, and expands recurring events into
 * individual occurrences. Used by EventApi (calendar view) and the
 * upcoming-events block.
 */
class EventExpander {

	/**
	 * Format a post as a raw event array (no expansion).
	 *
	 * @param \WP_Post $post The post to format.
	 * @return array<string, mixed>
	 */
	public static function format_event_raw( \WP_Post $post ): array {
		return [
			'id'                => $post->ID,
			'title'             => $post->post_title,
			'description'       => wpautop( $post->post_content ),
			'startDate'         => get_post_meta( $post->ID, 'rc_start_date', true ) ?: '',
			'endDate'           => get_post_meta( $post->ID, 'rc_end_date', true ) ?: '',
			'location'          => get_post_meta( $post->ID, 'rc_location', true ) ?: '',
			'category'          => get_post_meta( $post->ID, 'rc_category', true ) ?: 'other',
			'link'              => get_post_meta( $post->ID, 'rc_link', true ) ?: '',
			'linkLabel'         => get_post_meta( $post->ID, 'rc_link_label', true ) ?: '',
			'isRecurring'       => (bool) get_post_meta( $post->ID, 'rc_is_recurring', true ),
			'recurrenceType'    => get_post_meta( $post->ID, 'rc_recurrence_type', true ) ?: '',
			'recurrenceEndDate' => get_post_meta( $post->ID, 'rc_recurrence_end', true ) ?: '',
			'excludedDates'     => json_decode(
				get_post_meta( $post->ID, 'rc_excluded_dates', true ) ?: '[]',
				true,
			),
			'ssfGroupId'        => absint( get_post_meta( $post->ID, 'rc_ssf_group_id', true ) ),
			'ssfTournamentId'   => absint( get_post_meta( $post->ID, 'rc_ssf_tournament_id', true ) ),
		];
	}

	/**
	 * Format a base event (non-recurring) as an occurrence for output.
	 *
	 * @param array<string, mixed> $base The base event data.
	 * @return array<string, mixed>
	 */
	public static function format_occurrence( array $base ): array {
		return [
			'id'          => (string) $base['id'],
			'title'       => $base['title'],
			'startDate'   => $base['startDate'],
			'endDate'     => $base['endDate'],
			'description' => $base['description'],
			'location'    => $base['location'],
			'category'    => $base['category'],
			'source'      => 'cms',
			'link'        => $base['link'],
			'linkLabel'   => $base['linkLabel'],
		];
	}

	/**
	 * Expand a recurring event into individual occurrences.
	 *
	 * @param array<string, mixed> $event The base event data.
	 * @return array<int, array<string, mixed>>
	 */
	public static function expand_recurring( array $event ): array {
		$result = [];
		$id     = (string) $event['id'];
		$tz     = wp_timezone();
		$start  = new \DateTime( $event['startDate'], $tz );
		$end    = new \DateTime( $event['endDate'], $tz );

		// Duration = time-of-day difference only (so multi-month span does not inflate it).
		$start_secs    = (int) $start->format( 'H' ) * 3600 + (int) $start->format( 'i' ) * 60 + (int) $start->format( 's' );
		$end_secs      = (int) $end->format( 'H' ) * 3600 + (int) $end->format( 'i' ) * 60 + (int) $end->format( 's' );
		$duration_secs = $end_secs - $start_secs;

		// Series boundary = date portion of endDate.
		$series_end = new \DateTime( $end->format( 'Y-m-d' ) . 'T23:59:59', $tz );
		$step_days  = 'biweekly' === $event['recurrenceType'] ? 14 : 7;
		$excluded   = array_flip( $event['excludedDates'] ?? [] );

		$current = clone $start;
		while ( $current <= $series_end ) {
			$date_key = $current->format( 'Y-m-d' );
			if ( ! isset( $excluded[ $date_key ] ) ) {
				$occ_start = clone $current;
				$occ_end   = clone $current;
				$occ_end->modify( "+{$duration_secs} seconds" );

				$result[] = [
					'id'          => "{$id}-{$date_key}",
					'parentId'    => $id,
					'title'       => $event['title'],
					'startDate'   => $occ_start->format( 'c' ),
					'endDate'     => $occ_end->format( 'c' ),
					'description' => $event['description'],
					'location'    => $event['location'],
					'category'    => $event['category'],
					'source'      => 'cms',
					'link'        => $event['link'],
					'linkLabel'   => $event['linkLabel'],
				];
			}
			$current->modify( "+{$step_days} days" );
		}

		return $result;
	}

	/**
	 * Return the next N upcoming event occurrences (expanded, in chronological order).
	 *
	 * @param int                     $count Number of occurrences to return.
	 * @param \DateTimeInterface|null $now   Reference "now" for testing; defaults to current time.
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_upcoming( int $count, ?\DateTimeInterface $now = null ): array {
		if ( $count < 1 ) {
			return [];
		}

		$tz  = wp_timezone();
		$now = $now ?? new \DateTimeImmutable( 'now', $tz );

		$posts = get_posts(
			[
				'post_type'      => Event::POST_TYPE,
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Events are lightweight; we need all candidates to expand.
				'posts_per_page' => 200,
				'post_status'    => 'publish',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Required to order events by start date.
				'meta_key'       => 'rc_start_date',
				'orderby'        => 'meta_value',
				'order'          => 'ASC',
			]
		);

		$occurrences = [];
		foreach ( $posts as $post ) {
			$base = self::format_event_raw( $post );

			if ( $base['isRecurring'] && $base['recurrenceType'] && $base['recurrenceEndDate'] ) {
				$expanded = self::expand_recurring( $base );
				foreach ( $expanded as $occ ) {
					$occurrences[] = $occ;
				}
			} else {
				$occurrences[] = self::format_occurrence( $base );
			}
		}

		// Filter to future occurrences (endDate >= now), sort by startDate, then limit.
		$future = array_filter(
			$occurrences,
			static function ( array $occ ) use ( $now ): bool {
				$end_str = $occ['endDate'] ?: $occ['startDate'];
				if ( ! $end_str ) {
					return false;
				}
				$end = new \DateTimeImmutable( $end_str );
				return $end >= $now;
			}
		);

		usort(
			$future,
			static function ( array $a, array $b ): int {
				return strcmp( $a['startDate'], $b['startDate'] );
			}
		);

		return array_slice( $future, 0, $count );
	}
}
