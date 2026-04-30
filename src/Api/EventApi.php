<?php
/**
 * Event REST API endpoints.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

use Rockaden\PostTypes\Event;
use Rockaden\Services\EventExpander;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Provides REST endpoints for calendar events with recurring expansion.
 */
class EventApi {

	private const NAMESPACE = 'rockaden/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/events',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'list_events' ],
					'permission_callback' => '__return_true',
					'args'                => [
						'month' => [
							'type'        => 'string',
							'description' => 'Filter by month (YYYY-MM). When present, returns expanded recurring events. When absent, returns raw events.',
							'required'    => false,
						],
					],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ self::class, 'create_event' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/events/(?P<id>\d+)',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'get_event' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ self::class, 'update_event' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);
	}

	/**
	 * Permission callback for write operations.
	 *
	 * @return bool
	 */
	public static function can_edit(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * List events, optionally expanded for a given month.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function list_events( WP_REST_Request $request ): WP_REST_Response {
		$month = $request->get_param( 'month' );

		$args = [
			'post_type'      => Event::POST_TYPE,
			'posts_per_page' => 200, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Events are lightweight; need all for calendar.
			'post_status'    => 'publish',
			'meta_key'       => 'rc_start_date', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Ordering by start date is required for calendar display.
			'orderby'        => 'meta_value',
			'order'          => 'ASC',
		];

		// If month is specified, filter events that could appear in that month.
		if ( $month && preg_match( '/^\d{4}-\d{2}$/', $month ) ) {
			$month_start = $month . '-01T00:00:00';
			$month_end   = gmdate( 'Y-m-t', strtotime( $month_start ) ) . 'T23:59:59';

			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Required for date-range filtering of events.
			$args['meta_query'] = [
				'relation' => 'AND',
				[
					'key'     => 'rc_start_date',
					'value'   => $month_end,
					'compare' => '<=',
					'type'    => 'DATETIME',
				],
				[
					'relation' => 'OR',
					[
						'key'     => 'rc_end_date',
						'value'   => $month_start,
						'compare' => '>=',
						'type'    => 'DATETIME',
					],
					[
						'key'     => 'rc_recurrence_end',
						'value'   => $month_start,
						'compare' => '>=',
						'type'    => 'DATETIME',
					],
				],
			];
		}

		$posts = get_posts( $args );

		// No month param: return raw events (for admin dropdowns).
		if ( ! $month ) {
			$events = array_map( [ EventExpander::class, 'format_event_raw' ], $posts );
			return new WP_REST_Response( $events );
		}

		// With month param: return expanded events (for calendar).
		$events = [];
		foreach ( $posts as $post ) {
			$base = EventExpander::format_event_raw( $post );

			if ( $base['isRecurring'] && $base['recurrenceType'] && $base['recurrenceEndDate'] ) {
				$expanded = EventExpander::expand_recurring( $base );
				array_push( $events, ...$expanded );
			} else {
				$events[] = EventExpander::format_occurrence( $base );
			}
		}

		return new WP_REST_Response( $events );
	}

	/**
	 * Get a single event.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_event( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || Event::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Event not found', [ 'status' => 404 ] );
		}

		return new WP_REST_Response( EventExpander::format_event_raw( $post ) );
	}

	/**
	 * Create an event.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_event( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$body  = $request->get_json_params();
		$title = sanitize_text_field( $body['title'] ?? '' );

		if ( ! $title ) {
			return new WP_Error( 'missing_title', 'Event title is required', [ 'status' => 400 ] );
		}
		if ( empty( $body['startDate'] ) || empty( $body['endDate'] ) ) {
			return new WP_Error( 'missing_dates', 'startDate and endDate are required', [ 'status' => 400 ] );
		}

		$post_id = wp_insert_post(
			[
				'post_type'    => Event::POST_TYPE,
				'post_title'   => $title,
				'post_content' => sanitize_textarea_field( $body['description'] ?? '' ),
				'post_status'  => 'publish',
			]
		);

		if ( is_wp_error( $post_id ) ) { // @phpstan-ignore function.impossibleType
			return $post_id;
		}

		self::save_event_meta( $post_id, $body );

		return new WP_REST_Response( EventExpander::format_event_raw( get_post( $post_id ) ), 201 );
	}

	/**
	 * Update an event.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_event( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || Event::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Event not found', [ 'status' => 404 ] );
		}

		$body    = $request->get_json_params();
		$updates = [ 'ID' => $post->ID ];

		if ( isset( $body['title'] ) ) {
			$updates['post_title'] = sanitize_text_field( $body['title'] );
		}
		if ( isset( $body['description'] ) ) {
			$updates['post_content'] = sanitize_textarea_field( $body['description'] );
		}

		wp_update_post( $updates );
		self::save_event_meta( $post->ID, $body );

		return new WP_REST_Response( EventExpander::format_event_raw( get_post( $post->ID ) ) );
	}

	/**
	 * Save event meta fields from a request body.
	 *
	 * @param int                  $post_id The post ID.
	 * @param array<string, mixed> $body    The request body.
	 */
	private static function save_event_meta( int $post_id, array $body ): void {
		if ( isset( $body['startDate'] ) ) {
			update_post_meta( $post_id, 'rc_start_date', sanitize_text_field( $body['startDate'] ) );
		}
		if ( isset( $body['endDate'] ) ) {
			update_post_meta( $post_id, 'rc_end_date', sanitize_text_field( $body['endDate'] ) );
		}
		if ( isset( $body['location'] ) ) {
			update_post_meta( $post_id, 'rc_location', sanitize_text_field( $body['location'] ) );
		}
		if ( isset( $body['category'] ) ) {
			update_post_meta( $post_id, 'rc_category', sanitize_text_field( $body['category'] ) );
		}
		if ( isset( $body['link'] ) ) {
			update_post_meta( $post_id, 'rc_link', esc_url_raw( $body['link'] ) );
		}
		if ( isset( $body['linkLabel'] ) ) {
			update_post_meta( $post_id, 'rc_link_label', sanitize_text_field( $body['linkLabel'] ) );
		}

		if ( isset( $body['isRecurring'] ) ) {
			update_post_meta( $post_id, 'rc_is_recurring', $body['isRecurring'] ? '1' : '' );
		}
		if ( isset( $body['recurrenceType'] ) ) {
			update_post_meta( $post_id, 'rc_recurrence_type', sanitize_text_field( $body['recurrenceType'] ) );
		}
		if ( isset( $body['excludedDates'] ) ) {
			$excluded = is_array( $body['excludedDates'] ) ? $body['excludedDates'] : [];
			update_post_meta( $post_id, 'rc_excluded_dates', wp_slash( wp_json_encode( $excluded ) ) );
		}

		if ( isset( $body['ssfGroupId'] ) ) {
			update_post_meta( $post_id, 'rc_ssf_group_id', absint( $body['ssfGroupId'] ) );
		}
		if ( isset( $body['ssfTournamentId'] ) ) {
			update_post_meta( $post_id, 'rc_ssf_tournament_id', absint( $body['ssfTournamentId'] ) );
		}

		// Auto-derive rc_recurrence_end from rc_end_date for recurring events.
		$is_recurring = get_post_meta( $post_id, 'rc_is_recurring', true );
		$end_date     = get_post_meta( $post_id, 'rc_end_date', true );

		if ( $is_recurring && $end_date ) {
			$rec_end = gmdate( 'c', strtotime( gmdate( 'Y-m-d', strtotime( $end_date ) ) ) );
			update_post_meta( $post_id, 'rc_recurrence_end', $rec_end );
		} elseif ( ! $is_recurring ) {
			update_post_meta( $post_id, 'rc_recurrence_end', '' );
		}
	}
}
