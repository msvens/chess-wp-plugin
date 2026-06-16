<?php
/**
 * Owned calendar-event linking shared by tournaments and training groups.
 *
 * @package Rockaden
 */

namespace Rockaden\Services;

use Rockaden\PostTypes\Event;

/**
 * Manages the single calendar event (rc_event) projected from an owner post
 * (a tournament or a training group). The owner stores the event id in
 * `rc_event_id`; the event back-references its owner via `rc_owner_type` +
 * `rc_owner_id`, so updating and cascade-delete only ever touch an event the
 * owner created (never an unrelated or shared one). The event's
 * dates/time/recurrence are authored in the owner's form, not synced from the
 * owner's lifecycle dates.
 */
class CalendarEventLink {

	/**
	 * Create / sync / remove the owned calendar event from a form payload. A
	 * null payload removes the event; an array payload creates or updates it.
	 * Callers guard on `array_key_exists` so an absent key leaves it untouched.
	 *
	 * @param int                       $owner_id         Owner post ID (tournament or training group).
	 * @param string                    $owner_type       Owner type tag ('tournament' | 'training_group').
	 * @param array<string, mixed>|null $payload          The form's calendarEvent payload, or null to remove.
	 * @param string                    $default_category Category fallback when the payload omits it.
	 */
	public static function reconcile( int $owner_id, string $owner_type, ?array $payload, string $default_category ): void {
		$event_id = (int) get_post_meta( $owner_id, 'rc_event_id', true );
		$owned    = $event_id && self::owned_by( $event_id, $owner_id, $owner_type );

		if ( null === $payload ) {
			if ( $owned ) {
				wp_delete_post( $event_id, true );
			}
			update_post_meta( $owner_id, 'rc_event_id', 0 );
			return;
		}

		$post         = get_post( $owner_id );
		$title        = $post ? $post->post_title : '';
		$start        = sanitize_text_field( (string) ( $payload['startDate'] ?? '' ) );
		$end          = sanitize_text_field( (string) ( $payload['endDate'] ?? '' ) );
		$location     = sanitize_text_field( (string) ( $payload['location'] ?? '' ) );
		$category     = sanitize_text_field( (string) ( $payload['category'] ?? $default_category ) );
		$is_recurring = ! empty( $payload['isRecurring'] );
		$recurrence   = sanitize_text_field( (string) ( $payload['recurrenceType'] ?? 'weekly' ) );

		if ( ! $owned ) {
			$inserted = wp_insert_post(
				[
					'post_type'   => Event::POST_TYPE,
					'post_title'  => $title,
					'post_status' => 'publish',
				]
			);
			if ( ! $inserted ) {
				return;
			}
			$event_id = (int) $inserted;
			update_post_meta( $event_id, 'rc_owner_type', $owner_type );
			update_post_meta( $event_id, 'rc_owner_id', $owner_id );
			update_post_meta( $owner_id, 'rc_event_id', $event_id );
		} else {
			wp_update_post(
				[
					'ID'         => $event_id,
					'post_title' => $title,
				]
			);
		}

		// A recurring occurrence ends on its start day (the series length is the
		// recurrence end below), so the end never carries a far-future series end.
		$end = EventExpander::occurrence_end_on_start_day( $start, $end, $is_recurring );

		update_post_meta( $event_id, 'rc_start_date', $start );
		update_post_meta( $event_id, 'rc_end_date', $end );
		update_post_meta( $event_id, 'rc_location', $location );
		update_post_meta( $event_id, 'rc_category', $category );
		update_post_meta( $event_id, 'rc_is_recurring', $is_recurring ? '1' : '' );
		update_post_meta( $event_id, 'rc_recurrence_type', $is_recurring ? $recurrence : '' );
		// Series end is authored in the form (date-only); empty = no end.
		$rec_end = substr( sanitize_text_field( (string) ( $payload['recurrenceEndDate'] ?? '' ) ), 0, 10 );
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $rec_end ) ) {
			$rec_end = '';
		}
		update_post_meta( $event_id, 'rc_recurrence_end', $is_recurring ? $rec_end : '' );
	}

	/**
	 * Delete the owner's owned calendar event, if any. Safe to call on every
	 * owner deletion — it no-ops when there is no owned event.
	 *
	 * @param int    $owner_id   Owner post ID.
	 * @param string $owner_type Owner type tag.
	 */
	public static function cascade_delete( int $owner_id, string $owner_type ): void {
		$event_id = (int) get_post_meta( $owner_id, 'rc_event_id', true );
		if ( $event_id && self::owned_by( $event_id, $owner_id, $owner_type ) ) {
			wp_delete_post( $event_id, true );
		}
	}

	/**
	 * Whether an event is the projection owned by the given owner.
	 *
	 * @param int    $event_id   Event post ID.
	 * @param int    $owner_id   Owner post ID.
	 * @param string $owner_type Owner type tag.
	 * @return bool
	 */
	public static function owned_by( int $event_id, int $owner_id, string $owner_type ): bool {
		return get_post_meta( $event_id, 'rc_owner_type', true ) === $owner_type
			&& (int) get_post_meta( $event_id, 'rc_owner_id', true ) === $owner_id;
	}
}
