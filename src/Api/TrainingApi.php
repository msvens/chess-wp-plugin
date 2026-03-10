<?php
/**
 * Training REST API endpoints.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

use Rockaden\PostTypes\TrainingGroup;
use Rockaden\PostTypes\TrainingSession;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Provides REST endpoints for training groups, participants, and sessions.
 */
class TrainingApi {

	private const NAMESPACE = 'rockaden/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		// Training Groups.
		register_rest_route(
			self::NAMESPACE,
			'/training-groups',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'list_groups' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'POST',
					'callback'            => [ self::class, 'create_group' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'get_group' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ self::class, 'update_group' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ self::class, 'delete_group' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)/participants',
			[
				'methods'             => 'POST',
				'callback'            => [ self::class, 'add_participant' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)/participants/(?P<pid>[a-zA-Z0-9_-]+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ self::class, 'deactivate_participant' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		// Rounds.
		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)/rounds',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_rounds' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)/rounds/(?P<roundIdx>\d+)/games/(?P<gameIdx>\d+)',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_round_result' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		// Training Sessions.
		register_rest_route(
			self::NAMESPACE,
			'/training-groups/(?P<id>\d+)/sessions',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ self::class, 'list_sessions' ],
					'permission_callback' => '__return_true',
				],
				[
					'methods'             => 'POST',
					'callback'            => [ self::class, 'create_session' ],
					'permission_callback' => [ self::class, 'can_edit' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-sessions/(?P<id>\d+)/attendance',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_attendance' ],
				'permission_callback' => [ self::class, 'can_edit' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/training-sessions/(?P<id>\d+)/notes',
			[
				'methods'             => 'PUT',
				'callback'            => [ self::class, 'save_notes' ],
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
	 * List all training groups.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function list_groups( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by REST callback signature.
		$posts = get_posts(
			[
				'post_type'      => TrainingGroup::POST_TYPE,
				'posts_per_page' => 100,
				'post_status'    => 'publish',
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);

		$groups = array_map( [ self::class, 'format_group' ], $posts );

		return new WP_REST_Response( $groups );
	}

	/**
	 * Get a single training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_group( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
		}

		return new WP_REST_Response( self::format_group( $post ) );
	}

	/**
	 * Create a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_group( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$body  = $request->get_json_params();
		$title = sanitize_text_field( $body['title'] ?? '' );

		if ( ! $title ) {
			return new WP_Error( 'missing_title', 'Group title is required', [ 'status' => 400 ] );
		}

		$post_id = wp_insert_post(
			[
				'post_type'    => TrainingGroup::POST_TYPE,
				'post_title'   => $title,
				'post_content' => sanitize_textarea_field( $body['description'] ?? '' ),
				'post_status'  => 'publish',
			]
		);

		if ( is_wp_error( $post_id ) ) { // @phpstan-ignore function.impossibleType
			return $post_id;
		}

		if ( ! empty( $body['semester'] ) ) {
			update_post_meta( $post_id, 'rc_semester', sanitize_text_field( $body['semester'] ) );
		}
		if ( isset( $body['groupType'] ) ) {
			$allowed_types = [ 'training', 'tournament', 'both' ];
			$group_type    = sanitize_text_field( $body['groupType'] );
			if ( in_array( $group_type, $allowed_types, true ) ) {
				update_post_meta( $post_id, 'rc_group_type', $group_type );
				// Keep rc_has_tournament in sync for backward compat.
				update_post_meta( $post_id, 'rc_has_tournament', 'training' !== $group_type ? '1' : '' );
			}
		} elseif ( isset( $body['hasTournament'] ) ) {
			update_post_meta( $post_id, 'rc_has_tournament', (bool) $body['hasTournament'] ? '1' : '' );
		}
		if ( ! empty( $body['timeControl'] ) ) {
			update_post_meta( $post_id, 'rc_time_control', sanitize_text_field( $body['timeControl'] ) );
		}
		if ( ! empty( $body['eventId'] ) ) {
			update_post_meta( $post_id, 'rc_event_id', (int) $body['eventId'] );
		}
		if ( ! empty( $body['ssfGroupId'] ) ) {
			update_post_meta( $post_id, 'rc_ssf_group_id', (int) $body['ssfGroupId'] );
		}
		if ( ! empty( $body['trainers'] ) ) {
			update_post_meta( $post_id, 'rc_trainers', sanitize_text_field( $body['trainers'] ) );
		}
		if ( ! empty( $body['contact'] ) ) {
			update_post_meta( $post_id, 'rc_contact', sanitize_text_field( $body['contact'] ) );
		}
		if ( ! empty( $body['tournamentLink'] ) ) {
			update_post_meta( $post_id, 'rc_tournament_link', esc_url_raw( $body['tournamentLink'] ) );
		}
		if ( isset( $body['showParticipants'] ) ) {
			update_post_meta( $post_id, 'rc_show_participants', (bool) $body['showParticipants'] ? '1' : '0' );
		}
		if ( isset( $body['showStandings'] ) ) {
			update_post_meta( $post_id, 'rc_show_standings', (bool) $body['showStandings'] ? '1' : '0' );
		}

		return new WP_REST_Response( self::format_group( get_post( $post_id ) ), 201 );
	}

	/**
	 * Update a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_group( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
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

		if ( isset( $body['semester'] ) ) {
			update_post_meta( $post->ID, 'rc_semester', sanitize_text_field( $body['semester'] ) );
		}
		if ( isset( $body['groupType'] ) ) {
			$allowed_types = [ 'training', 'tournament', 'both' ];
			$group_type    = sanitize_text_field( $body['groupType'] );
			if ( in_array( $group_type, $allowed_types, true ) ) {
				update_post_meta( $post->ID, 'rc_group_type', $group_type );
				update_post_meta( $post->ID, 'rc_has_tournament', 'training' !== $group_type ? '1' : '' );
			}
		} elseif ( isset( $body['hasTournament'] ) ) {
			update_post_meta( $post->ID, 'rc_has_tournament', (bool) $body['hasTournament'] ? '1' : '' );
		}
		if ( isset( $body['timeControl'] ) ) {
			update_post_meta( $post->ID, 'rc_time_control', sanitize_text_field( $body['timeControl'] ) );
		}
		if ( isset( $body['eventId'] ) ) {
			update_post_meta( $post->ID, 'rc_event_id', (int) $body['eventId'] );
		}
		if ( isset( $body['ssfGroupId'] ) ) {
			update_post_meta( $post->ID, 'rc_ssf_group_id', (int) $body['ssfGroupId'] );
		}
		if ( isset( $body['status'] ) ) {
			$allowed = [ 'draft', 'active', 'archived' ];
			$status  = sanitize_text_field( $body['status'] );
			if ( in_array( $status, $allowed, true ) ) {
				update_post_meta( $post->ID, 'rc_status', $status );
			}
		}
		if ( isset( $body['trainers'] ) ) {
			update_post_meta( $post->ID, 'rc_trainers', sanitize_text_field( $body['trainers'] ) );
		}
		if ( isset( $body['contact'] ) ) {
			update_post_meta( $post->ID, 'rc_contact', sanitize_text_field( $body['contact'] ) );
		}
		if ( isset( $body['tournamentLink'] ) ) {
			update_post_meta( $post->ID, 'rc_tournament_link', esc_url_raw( $body['tournamentLink'] ) );
		}
		if ( isset( $body['showParticipants'] ) ) {
			update_post_meta( $post->ID, 'rc_show_participants', (bool) $body['showParticipants'] ? '1' : '0' );
		}
		if ( isset( $body['showStandings'] ) ) {
			update_post_meta( $post->ID, 'rc_show_standings', (bool) $body['showStandings'] ? '1' : '0' );
		}

		return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
	}

	/**
	 * Delete a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_group( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_url_params()['id'] );

		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
		}

		wp_delete_post( $post->ID, true );

		return new WP_REST_Response( [ 'deleted' => true ] );
	}

	/**
	 * Add a participant to a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function add_participant( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
		}

		$body         = $request->get_json_params();
		$participants = json_decode( get_post_meta( $post->ID, 'rc_participants', true ) ?: '[]', true );

		// Check if already exists (reactivate if inactive).
		foreach ( $participants as &$p ) {
			if ( ( $body['id'] ?? '' ) === $p['id'] ) {
				$p['active'] = true;
				$p['name']   = $body['name'] ?? $p['name'];
				$p['ssfId']  = $body['ssfId'] ?? $p['ssfId'];
				update_post_meta( $post->ID, 'rc_participants', wp_slash( wp_json_encode( $participants ) ) );
				return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
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

		return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
	}

	/**
	 * Deactivate a participant in a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function deactivate_participant( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
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

		return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
	}

	/**
	 * Save rounds for a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_rounds( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
		}

		$body   = $request->get_json_params();
		$rounds = $body['rounds'] ?? [];

		update_post_meta( $post->ID, 'rc_rounds', wp_slash( wp_json_encode( $rounds ) ) );

		return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
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
		if ( ! $post || TrainingGroup::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Training group not found', [ 'status' => 404 ] );
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

		return new WP_REST_Response( self::format_group( get_post( $post->ID ) ) );
	}

	/**
	 * List sessions for a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function list_sessions( WP_REST_Request $request ): WP_REST_Response {
		$group_id = (int) $request->get_url_params()['id'];

		$posts = get_posts(
			[
				'post_type'      => TrainingSession::POST_TYPE,
				'posts_per_page' => 200, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- Sessions are lightweight; need all for group display.
				'post_status'    => 'publish',
				'meta_key'       => 'rc_session_date', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Ordering by session date is required.
				'orderby'        => 'meta_value',
				'order'          => 'ASC',
				'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Required for filtering sessions by group.
					[
						'key'   => 'rc_group_id',
						'value' => $group_id,
						'type'  => 'NUMERIC',
					],
				],
			]
		);

		$sessions = array_map( [ self::class, 'format_session' ], $posts );

		return new WP_REST_Response( $sessions );
	}

	/**
	 * Create a session for a training group.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_session( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$group_id   = (int) $url_params['id'];
		$body       = $request->get_json_params();
		$date       = $body['date'] ?? '';

		if ( ! $date ) {
			return new WP_Error( 'missing_date', 'Session date is required', [ 'status' => 400 ] );
		}

		// Check for existing session on this date.
		$existing = get_posts(
			[
				'post_type'   => TrainingSession::POST_TYPE,
				'post_status' => 'publish',
				'meta_query'  => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Required for duplicate detection.
					'relation' => 'AND',
					[
						'key'   => 'rc_group_id',
						'value' => $group_id,
						'type'  => 'NUMERIC',
					],
					[
						'key'   => 'rc_session_date',
						'value' => $date,
					],
				],
			]
		);

		if ( ! empty( $existing ) ) {
			return new WP_REST_Response( self::format_session( $existing[0] ) );
		}

		$post_id = wp_insert_post(
			[
				'post_type'   => TrainingSession::POST_TYPE,
				'post_title'  => "Session {$date}",
				'post_status' => 'publish',
			]
		);

		if ( is_wp_error( $post_id ) ) { // @phpstan-ignore function.impossibleType
			return $post_id;
		}

		update_post_meta( $post_id, 'rc_group_id', $group_id );
		update_post_meta( $post_id, 'rc_session_date', $date );

		return new WP_REST_Response( self::format_session( get_post( $post_id ) ), 201 );
	}

	/**
	 * Save attendance for a session.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_attendance( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || TrainingSession::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Session not found', [ 'status' => 404 ] );
		}

		$body = $request->get_json_params();
		update_post_meta( $post->ID, 'rc_attendance', wp_slash( wp_json_encode( $body['attendance'] ?? [] ) ) );

		return new WP_REST_Response( self::format_session( get_post( $post->ID ) ) );
	}

	/**
	 * Save notes for a session.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_notes( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$url_params = $request->get_url_params();
		$post       = get_post( (int) $url_params['id'] );
		if ( ! $post || TrainingSession::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Session not found', [ 'status' => 404 ] );
		}

		$body = $request->get_json_params();
		update_post_meta( $post->ID, 'rc_notes', sanitize_textarea_field( $body['notes'] ?? '' ) );

		return new WP_REST_Response( self::format_session( get_post( $post->ID ) ) );
	}

	/**
	 * Format a group post as an array.
	 *
	 * @param \WP_Post $post The post to format.
	 * @return array<string, mixed>
	 */
	private static function format_group( \WP_Post $post ): array {
		$show_participants = get_post_meta( $post->ID, 'rc_show_participants', true );
		$show_standings    = get_post_meta( $post->ID, 'rc_show_standings', true );

		// Unset meta returns '' — treat as true for backward compat.
		$show_participants = ( '' === $show_participants ) ? true : (bool) $show_participants;
		$show_standings    = ( '' === $show_standings ) ? true : (bool) $show_standings;

		$is_editor    = current_user_can( 'edit_posts' );
		$participants = json_decode( get_post_meta( $post->ID, 'rc_participants', true ) ?: '[]', true );
		$rounds       = json_decode( get_post_meta( $post->ID, 'rc_rounds', true ) ?: '[]', true );

		// Filter data for public view.
		if ( ! $is_editor ) {
			if ( ! $show_participants ) {
				$participants = [];
			}
			if ( ! $show_standings ) {
				$rounds = [];
			}
		}

		// Derive groupType with backward compat: if rc_group_type is empty, fall back to rc_has_tournament.
		$group_type = get_post_meta( $post->ID, 'rc_group_type', true );
		if ( ! $group_type ) {
			$group_type = (bool) get_post_meta( $post->ID, 'rc_has_tournament', true ) ? 'both' : 'training';
		}

		return [
			'id'               => $post->ID,
			'slug'             => $post->post_name,
			'title'            => $post->post_title,
			'description'      => $post->post_content,
			'status'           => get_post_meta( $post->ID, 'rc_status', true ) ?: 'draft',
			'semester'         => get_post_meta( $post->ID, 'rc_semester', true ) ?: '',
			'groupType'        => $group_type,
			'hasTournament'    => 'training' !== $group_type,
			'timeControl'      => get_post_meta( $post->ID, 'rc_time_control', true ) ?: 'classical',
			'eventId'          => (int) get_post_meta( $post->ID, 'rc_event_id', true ),
			'ssfGroupId'       => (int) get_post_meta( $post->ID, 'rc_ssf_group_id', true ),
			'participants'     => $participants,
			'trainers'         => get_post_meta( $post->ID, 'rc_trainers', true ) ?: '',
			'contact'          => get_post_meta( $post->ID, 'rc_contact', true ) ?: '',
			'tournamentLink'   => get_post_meta( $post->ID, 'rc_tournament_link', true ) ?: '',
			'rounds'           => $rounds,
			'showParticipants' => $show_participants,
			'showStandings'    => $show_standings,
			'createdBy'        => $post->post_author,
		];
	}

	/**
	 * Format a session post as an array.
	 *
	 * @param \WP_Post $post The post to format.
	 * @return array<string, mixed>
	 */
	private static function format_session( \WP_Post $post ): array {
		return [
			'id'          => $post->ID,
			'groupId'     => (int) get_post_meta( $post->ID, 'rc_group_id', true ),
			'sessionDate' => get_post_meta( $post->ID, 'rc_session_date', true ) ?: '',
			'notes'       => get_post_meta( $post->ID, 'rc_notes', true ) ?: '',
			'attendance'  => json_decode( get_post_meta( $post->ID, 'rc_attendance', true ) ?: '[]', true ),
		];
	}
}
