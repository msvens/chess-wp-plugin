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
			'ownerType'         => get_post_meta( $post->ID, 'rc_owner_type', true ) ?: '',
			'ownerUrl'          => self::owner_url( $post->ID ),
		];
	}

	/**
	 * Public URL of the entity that owns this event ('' if none / not public).
	 *
	 * @param int $post_id Event post ID.
	 * @return string
	 */
	private static function owner_url( int $post_id ): string {
		$owner_type = get_post_meta( $post_id, 'rc_owner_type', true );
		$owner_id   = (int) get_post_meta( $post_id, 'rc_owner_id', true );
		if ( 'tournament' !== $owner_type || ! $owner_id ) {
			return '';
		}
		$permalink = get_permalink( $owner_id );
		return is_string( $permalink ) ? $permalink : '';
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
			'ownerType'   => $base['ownerType'] ?? '',
			'ownerUrl'    => $base['ownerUrl'] ?? '',
		];
	}

	/**
	 * Expand a recurring event into individual occurrences.
	 *
	 * The series boundary is the explicit recurrence-end date (`recurrenceEndDate`)
	 * when set; otherwise the series is unbounded and materialises only within the
	 * supplied query window. Each occurrence keeps the base event's time-of-day
	 * duration (recurring occurrences are assumed to begin and end on the same
	 * day — multi-day occurrences are out of scope).
	 *
	 * @param array<string, mixed> $event        The base event data.
	 * @param string|null          $window_start Lower bound (e.g. month start) — occurrences ending before this are skipped.
	 * @param string|null          $window_end   Upper bound (e.g. month end) — caps an unbounded series.
	 * @return array<int, array<string, mixed>>
	 */
	public static function expand_recurring( array $event, ?string $window_start = null, ?string $window_end = null ): array {
		$result = [];
		$id     = (string) $event['id'];
		$tz     = wp_timezone();
		$start  = new \DateTime( $event['startDate'], $tz );
		$end    = new \DateTime( $event['endDate'], $tz );

		// Duration = time-of-day difference only (so an overloaded multi-month
		// endDate from legacy data does not inflate the occurrence length).
		$start_secs    = (int) $start->format( 'H' ) * 3600 + (int) $start->format( 'i' ) * 60 + (int) $start->format( 's' );
		$end_secs      = (int) $end->format( 'H' ) * 3600 + (int) $end->format( 'i' ) * 60 + (int) $end->format( 's' );
		$duration_secs = $end_secs - $start_secs;

		$step_days = 'biweekly' === $event['recurrenceType'] ? 14 : 7;
		$excluded  = array_flip( $event['excludedDates'] ?? [] );

		// Series boundary: the explicit recurrence-end date when set; otherwise
		// the query window end (an unbounded series only renders within the view).
		$rec_end_raw = (string) ( $event['recurrenceEndDate'] ?? '' );
		if ( '' !== $rec_end_raw ) {
			$series_end = new \DateTime( substr( $rec_end_raw, 0, 10 ) . 'T23:59:59', $tz );
			if ( $window_end ) {
				$win_end_dt = new \DateTime( $window_end, $tz );
				if ( $win_end_dt < $series_end ) {
					$series_end = $win_end_dt;
				}
			}
		} elseif ( $window_end ) {
			$series_end = new \DateTime( $window_end, $tz );
		} else {
			// No explicit end and no window: cap with a safety horizon.
			$series_end = ( clone $start )->modify( '+18 months' );
		}

		$current = clone $start;

		// Fast-forward to the occurrence at/just-before the window start so a
		// far-future window doesn't scan from the series' beginning.
		$win_start_dt = $window_start ? new \DateTime( $window_start, $tz ) : null;
		if ( $win_start_dt && $current < $win_start_dt ) {
			$start_date = new \DateTime( $start->format( 'Y-m-d' ), $tz );
			$ws_date    = new \DateTime( $win_start_dt->format( 'Y-m-d' ), $tz );
			$diff_days  = (int) $start_date->diff( $ws_date )->days;
			$k          = intdiv( $diff_days, $step_days );
			if ( $k > 0 ) {
				$current->modify( '+' . ( $k * $step_days ) . ' days' );
			}
		}

		while ( $current <= $series_end ) {
			$date_key  = $current->format( 'Y-m-d' );
			$occ_start = clone $current;
			$occ_end   = clone $current;
			$occ_end->modify( "+{$duration_secs} seconds" );

			$in_window = ! $win_start_dt || $occ_end >= $win_start_dt;
			if ( $in_window && ! isset( $excluded[ $date_key ] ) ) {
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
					'ownerType'   => $event['ownerType'] ?? '',
					'ownerUrl'    => $event['ownerUrl'] ?? '',
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
		$now = $now ? \DateTimeImmutable::createFromInterface( $now ) : new \DateTimeImmutable( 'now', $tz );

		// Bound unbounded series so the upcoming list never expands indefinitely.
		$horizon_start = $now->format( 'Y-m-d' ) . 'T00:00:00';
		$horizon_end   = $now->add( new \DateInterval( 'P12M' ) )->format( 'Y-m-d' ) . 'T23:59:59';

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

			if ( $base['isRecurring'] && $base['recurrenceType'] ) {
				$expanded = self::expand_recurring( $base, $horizon_start, $horizon_end );
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
