<?php
/**
 * Tournament REST API endpoints.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

use Rockaden\PostTypes\Tournament;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Provides REST endpoints for tournaments, participants, and rounds.
 */
class TournamentApi {

	private const NAMESPACE = 'rockaden/v1';

	private const ALLOWED_CATEGORIES = [ 'junior', 'youth', 'adult', 'senior', 'mixed' ];

	private const ALLOWED_STATUSES = [ 'planned', 'active', 'completed' ];

	private const ALLOWED_FORMATS = [ 'round-robin' ];

	private const ALLOWED_TIME_CONTROLS = [ 'classical', 'rapid', 'blitz' ];

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/tournaments',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'list_tournaments' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'POST',
					'callback'            => [ self::class, 'create_tournament' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/tournaments/(?P<id>\d+)',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'get_tournament' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ self::class, 'update_tournament' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ self::class, 'delete_tournament' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/tournaments/(?P<id>\d+)/participants',
			[
				'methods'             => 'POST',
				'callback'            => [ self::class, 'add_participant' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/tournaments/(?P<id>\d+)/participants/(?P<pid>[a-zA-Z0-9_-]+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ self::class, 'deactivate_participant' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/tournaments/(?P<id>\d+)/rounds',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_rounds' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/tournaments/(?P<id>\d+)/rounds/(?P<roundIdx>\d+)/games/(?P<gameIdx>\d+)',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_round_result' ],
				'permission_callback' => [ self::class, 'can_edit' ],
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
	 * List all tournaments, optionally filtered by status/category.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function list_tournaments( WP_REST_Request $request ): WP_REST_Response {
		$query_args = [
			'post_type'      => Tournament::POST_TYPE,
			'posts_per_page' => 100,
			'post_status'    => 'publish',
			'orderby'        => 'date',
			'order'          => 'DESC',
		];

		$meta_query = [];

		$status = sanitize_text_field( (string) $request->get_param( 'status' ) );
		if ( $status && in_array( $status, self::ALLOWED_STATUSES, true ) ) {
			$meta_query[] = [
				'key'   => 'rc_status',
				'value' => $status,
			];
		}

		$category = sanitize_text_field( (string) $request->get_param( 'category' ) );
		if ( $category && in_array( $category, self::ALLOWED_CATEGORIES, true ) ) {
			$meta_query[] = [
				'key'   => 'rc_category',
				'value' => $category,
			];
		}

		if ( ! empty( $meta_query ) ) {
			$query_args['meta_query'] = $meta_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Listing endpoint, intentional filter.
		}

		$posts       = get_posts( $query_args );
		$tournaments = array_map( [ self::class, 'format_tournament' ], $posts );

		return new WP_REST_Response( $tournaments );
	}

	/**
	 * Get a single tournament.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_tournament( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		return new WP_REST_Response( self::format_tournament( $post ) );
	}

	/**
	 * Create a tournament.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_tournament( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$body  = $request->get_json_params();
		$title = sanitize_text_field( $body['title'] ?? '' );

		if ( ! $title ) {
			return new WP_Error( 'missing_title', 'Tournament title is required', [ 'status' => 400 ] );
		}

		$post_id = wp_insert_post(
			[
				'post_type'    => Tournament::POST_TYPE,
				'post_title'   => $title,
				'post_content' => sanitize_textarea_field( $body['description'] ?? '' ),
				'post_status'  => 'publish',
			]
		);

		if ( is_wp_error( $post_id ) ) { // @phpstan-ignore function.impossibleType
			return $post_id;
		}

		self::apply_meta_from_body( (int) $post_id, $body, true );

		return new WP_REST_Response( self::format_tournament( get_post( $post_id ) ), 201 );
	}

	/**
	 * Update a tournament.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_tournament( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
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

		self::apply_meta_from_body( $post->ID, $body, false );

		return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
	}

	/**
	 * Apply meta updates from a request body.
	 *
	 * @param int                  $post_id      Tournament post ID.
	 * @param array<string, mixed> $body         Request body.
	 * @param bool                 $is_creating  True for create, false for update (controls isset vs. !empty checks).
	 */
	private static function apply_meta_from_body( int $post_id, array $body, bool $is_creating ): void {
		$check = fn ( string $key ) => $is_creating ? ! empty( $body[ $key ] ) : isset( $body[ $key ] );

		if ( $check( 'category' ) ) {
			$category = sanitize_text_field( $body['category'] );
			if ( in_array( $category, self::ALLOWED_CATEGORIES, true ) ) {
				update_post_meta( $post_id, 'rc_category', $category );
			}
		}
		if ( $check( 'status' ) ) {
			$status = sanitize_text_field( $body['status'] );
			if ( in_array( $status, self::ALLOWED_STATUSES, true ) ) {
				update_post_meta( $post_id, 'rc_status', $status );
			}
		}
		if ( $check( 'format' ) ) {
			$format = sanitize_text_field( $body['format'] );
			if ( in_array( $format, self::ALLOWED_FORMATS, true ) ) {
				update_post_meta( $post_id, 'rc_format', $format );
			}
		}
		if ( $check( 'timeControl' ) ) {
			$tc = sanitize_text_field( $body['timeControl'] );
			if ( in_array( $tc, self::ALLOWED_TIME_CONTROLS, true ) ) {
				update_post_meta( $post_id, 'rc_time_control', $tc );
			}
		}
		if ( isset( $body['ssfGroupId'] ) ) {
			update_post_meta( $post_id, 'rc_ssf_group_id', (int) $body['ssfGroupId'] );
		}
		if ( isset( $body['eventId'] ) ) {
			update_post_meta( $post_id, 'rc_event_id', (int) $body['eventId'] );
		}
		if ( isset( $body['externalLink'] ) ) {
			update_post_meta( $post_id, 'rc_external_link', esc_url_raw( $body['externalLink'] ) );
		}
		if ( isset( $body['startDate'] ) ) {
			update_post_meta( $post_id, 'rc_start_date', sanitize_text_field( $body['startDate'] ) );
		}
		if ( isset( $body['endDate'] ) ) {
			update_post_meta( $post_id, 'rc_end_date', sanitize_text_field( $body['endDate'] ) );
		}
		if ( isset( $body['showParticipants'] ) ) {
			update_post_meta( $post_id, 'rc_show_participants', (bool) $body['showParticipants'] ? '1' : '0' );
		}
		if ( isset( $body['showStandings'] ) ) {
			update_post_meta( $post_id, 'rc_show_standings', (bool) $body['showStandings'] ? '1' : '0' );
		}
	}

	/**
	 * Delete a tournament.
	 *
	 * When a tournament is deleted, any training groups that link to it have their
	 * link cleared so they don't point at a missing post.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_tournament( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		self::clear_linked_tournament_refs( $post->ID );

		wp_delete_post( $post->ID, true );

		return new WP_REST_Response( [ 'deleted' => true ] );
	}

	/**
	 * Clear rc_linked_tournament_id on any training group that pointed at this tournament.
	 *
	 * @param int $tournament_id The tournament being deleted.
	 */
	private static function clear_linked_tournament_refs( int $tournament_id ): void {
		$linked = get_posts(
			[
				'post_type'      => \Rockaden\PostTypes\TrainingGroup::POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Cleanup pass, expected count is tiny.
				'fields'         => 'ids',
				'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Required to find linked groups.
					[
						'key'   => 'rc_linked_tournament_id',
						'value' => $tournament_id,
						'type'  => 'NUMERIC',
					],
				],
			]
		);

		foreach ( $linked as $group_id ) {
			update_post_meta( (int) $group_id, 'rc_linked_tournament_id', 0 );
		}
	}

	/**
	 * Add a participant to a tournament.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function add_participant( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		$body         = $request->get_json_params();
		$participants = json_decode( get_post_meta( $post->ID, 'rc_participants', true ) ?: '[]', true );

		foreach ( $participants as &$p ) {
			if ( ( $body['id'] ?? '' ) === $p['id'] ) {
				$p['active'] = true;
				$p['name']   = $body['name'] ?? $p['name'];
				$p['ssfId']  = $body['ssfId'] ?? $p['ssfId'];
				update_post_meta( $post->ID, 'rc_participants', wp_slash( wp_json_encode( $participants ) ) );
				return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
			}
		}
		unset( $p );

		$participants[] = [
			'id'     => $body['id'] ?? wp_generate_uuid4(),
			'name'   => $body['name'] ?? '',
			'ssfId'  => $body['ssfId'] ?? null,
			'active' => true,
		];

		update_post_meta( $post->ID, 'rc_participants', wp_slash( wp_json_encode( $participants ) ) );

		return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
	}

	/**
	 * Deactivate a tournament participant.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function deactivate_participant( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		$pid          = $url_params['pid'];
		$participants = json_decode( get_post_meta( $post->ID, 'rc_participants', true ) ?: '[]', true );

		foreach ( $participants as &$p ) {
			if ( $p['id'] === $pid ) {
				$p['active'] = false;
				break;
			}
		}
		unset( $p );

		update_post_meta( $post->ID, 'rc_participants', wp_slash( wp_json_encode( $participants ) ) );

		return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
	}

	/**
	 * Save rounds for a tournament.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_rounds( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		$body   = $request->get_json_params();
		$rounds = $body['rounds'] ?? [];

		update_post_meta( $post->ID, 'rc_rounds', wp_slash( wp_json_encode( $rounds ) ) );

		return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
	}

	/**
	 * Save a single game result within a round.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_round_result( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || Tournament::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Tournament not found', [ 'status' => 404 ] );
		}

		$round_idx = (int) $url_params['roundIdx'];
		$game_idx  = (int) $url_params['gameIdx'];
		$body      = $request->get_json_params();
		$rounds    = json_decode( get_post_meta( $post->ID, 'rc_rounds', true ) ?: '[]', true );

		if ( $round_idx < 0 || $round_idx >= count( $rounds ) ) {
			return new WP_Error( 'invalid_round', 'Round index out of range', [ 'status' => 400 ] );
		}
		if ( $game_idx < 0 || $game_idx >= count( $rounds[ $round_idx ]['pairings'] ) ) {
			return new WP_Error( 'invalid_game', 'Game index out of range', [ 'status' => 400 ] );
		}

		$rounds[ $round_idx ]['pairings'][ $game_idx ]['result'] = $body['result'] ?? null;

		update_post_meta( $post->ID, 'rc_rounds', wp_slash( wp_json_encode( $rounds ) ) );

		return new WP_REST_Response( self::format_tournament( get_post( $post->ID ) ) );
	}

	/**
	 * Format a tournament post as an array.
	 *
	 * @param \WP_Post $post The post to format.
	 * @return array<string, mixed>
	 */
	private static function format_tournament( \WP_Post $post ): array {
		$show_participants = get_post_meta( $post->ID, 'rc_show_participants', true );
		$show_standings    = get_post_meta( $post->ID, 'rc_show_standings', true );

		// Unset meta returns '' — treat as true for backward compat.
		$show_participants = ( '' === $show_participants ) ? true : (bool) $show_participants;
		$show_standings    = ( '' === $show_standings ) ? true : (bool) $show_standings;

		$is_editor    = current_user_can( 'edit_posts' );
		$participants = json_decode( get_post_meta( $post->ID, 'rc_participants', true ) ?: '[]', true );
		$rounds       = json_decode( get_post_meta( $post->ID, 'rc_rounds', true ) ?: '[]', true );

		if ( ! $is_editor ) {
			if ( ! $show_participants ) {
				$participants = [];
			}
			if ( ! $show_standings ) {
				$rounds = [];
			}
		}

		return [
			'id'               => $post->ID,
			'slug'             => $post->post_name,
			'title'            => $post->post_title,
			'description'      => $post->post_content,
			'category'         => get_post_meta( $post->ID, 'rc_category', true ) ?: 'mixed',
			'status'           => get_post_meta( $post->ID, 'rc_status', true ) ?: 'planned',
			'format'           => get_post_meta( $post->ID, 'rc_format', true ) ?: 'round-robin',
			'timeControl'      => get_post_meta( $post->ID, 'rc_time_control', true ) ?: 'classical',
			'participants'     => $participants,
			'rounds'           => $rounds,
			'ssfGroupId'       => (int) get_post_meta( $post->ID, 'rc_ssf_group_id', true ),
			'eventId'          => (int) get_post_meta( $post->ID, 'rc_event_id', true ),
			'externalLink'     => get_post_meta( $post->ID, 'rc_external_link', true ) ?: '',
			'startDate'        => get_post_meta( $post->ID, 'rc_start_date', true ) ?: '',
			'endDate'          => get_post_meta( $post->ID, 'rc_end_date', true ) ?: '',
			'showParticipants' => $show_participants,
			'showStandings'    => $show_standings,
			'createdBy'        => $post->post_author,
		];
	}
}
