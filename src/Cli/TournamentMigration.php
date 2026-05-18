<?php
/**
 * WP-CLI commands for migrating tournament data out of training groups
 * into the new `rc_tournament` CPT.
 *
 * @package Rockaden
 */

namespace Rockaden\Cli;

use Rockaden\PostTypes\Tournament;
use Rockaden\PostTypes\TrainingGroup;
use WP_CLI;

/**
 * Migration commands. Registered from rockaden-chess.php under a WP_CLI guard.
 */
class TournamentMigration {

	private const LEGACY_META_KEYS = [
		'rc_group_type',
		'rc_has_tournament',
		'rc_time_control',
		'rc_rounds',
		'rc_ssf_group_id',
		'rc_tournament_link',
		'rc_show_participants',
		'rc_show_standings',
	];

	/**
	 * Register the commands with WP-CLI.
	 */
	public static function register(): void {
		WP_CLI::add_command( 'rockaden migrate-tournaments', [ self::class, 'migrate_tournaments' ] );
		WP_CLI::add_command( 'rockaden migrate-blocks', [ self::class, 'migrate_blocks' ] );
		WP_CLI::add_command( 'rockaden cleanup-legacy-meta', [ self::class, 'cleanup_legacy_meta' ] );
	}

	/**
	 * `wp rockaden migrate-tournaments [--dry-run]`
	 *
	 * For each training group that has tournament data, create a new
	 * rc_tournament post and link the group to it. Idempotent.
	 *
	 * @param array<int, string>    $args       Positional args (unused).
	 * @param array<string, string> $assoc_args Associative args.
	 */
	public static function migrate_tournaments( array $args, array $assoc_args ): void {
		unset( $args );
		$dry_run = isset( $assoc_args['dry-run'] );

		$groups = get_posts(
			[
				'post_type'      => TrainingGroup::POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- One-shot migration.
			]
		);

		$migrated = 0;
		$skipped  = 0;
		$warnings = 0;
		$prefix   = $dry_run ? '[dry-run] ' : '';

		foreach ( $groups as $group ) {
			$group_id = $group->ID;

			$existing_link = (int) get_post_meta( $group_id, 'rc_linked_tournament_id', true );
			if ( $existing_link > 0 ) {
				$existing_post = get_post( $existing_link );
				if ( $existing_post && Tournament::POST_TYPE === $existing_post->post_type ) {
					WP_CLI::log( sprintf( '[skip] Group "%s" (ID %d) already migrated to tournament #%d.', $group->post_title, $group_id, $existing_link ) );
					++$skipped;
					continue;
				}
				WP_CLI::warning( sprintf( 'Group "%s" (ID %d) points to missing tournament #%d — will re-create.', $group->post_title, $group_id, $existing_link ) );
				++$warnings;
			}

			$group_type      = (string) get_post_meta( $group_id, 'rc_group_type', true );
			$has_tournament  = (bool) get_post_meta( $group_id, 'rc_has_tournament', true );
			$rounds_raw      = (string) get_post_meta( $group_id, 'rc_rounds', true );
			$ssf_group_id    = (int) get_post_meta( $group_id, 'rc_ssf_group_id', true );
			$tournament_link = (string) get_post_meta( $group_id, 'rc_tournament_link', true );
			$participants    = (string) get_post_meta( $group_id, 'rc_participants', true );
			$rounds          = $rounds_raw ? json_decode( $rounds_raw, true ) : [];
			$has_rounds      = is_array( $rounds ) && ! empty( $rounds );

			$has_tournament_data =
				in_array( $group_type, [ 'tournament', 'both' ], true )
				|| $has_tournament
				|| $ssf_group_id > 0
				|| '' !== $tournament_link
				|| $has_rounds;

			if ( ! $has_tournament_data ) {
				continue;
			}

			// Validator pass: report orphan participant references.
			if ( $has_rounds ) {
				$participant_ids = self::participant_ids_from_json( $participants );
				$orphans         = self::find_orphan_refs( $rounds, $participant_ids );
				if ( ! empty( $orphans ) ) {
					WP_CLI::warning(
						sprintf(
							'Group "%s" (ID %d) has rounds referencing unknown participants: %s',
							$group->post_title,
							$group_id,
							implode( ', ', $orphans )
						)
					);
					++$warnings;
				}
			}

			WP_CLI::log( sprintf( '%sMigrating "%s" (ID %d) → new tournament', $prefix, $group->post_title, $group_id ) );

			if ( $dry_run ) {
				++$migrated;
				if ( 'tournament' === $group_type ) {
					WP_CLI::warning( sprintf( 'Group "%s" (ID %d) appears tournament-only. Consider deleting the group manually after verifying.', $group->post_title, $group_id ) );
					++$warnings;
				}
				continue;
			}

			$tournament_id = wp_insert_post(
				[
					'post_type'    => Tournament::POST_TYPE,
					'post_title'   => $group->post_title,
					'post_name'    => $group->post_name,
					'post_content' => $group->post_content,
					'post_status'  => 'publish',
				],
				true
			);

			if ( is_wp_error( $tournament_id ) ) {
				WP_CLI::warning( sprintf( 'Failed to create tournament for group %d: %s', $group_id, $tournament_id->get_error_message() ) );
				++$warnings;
				continue;
			}

			// Force the slug match (wp_insert_post may have auto-disambiguated).
			if ( $group->post_name && get_post_field( 'post_name', $tournament_id ) !== $group->post_name ) {
				wp_update_post(
					[
						'ID'        => $tournament_id,
						'post_name' => $group->post_name,
					]
				);
			}

			// Copy meta into the new tournament.
			$time_control      = (string) get_post_meta( $group_id, 'rc_time_control', true ) ?: 'classical';
			$show_participants = get_post_meta( $group_id, 'rc_show_participants', true );
			$show_standings    = get_post_meta( $group_id, 'rc_show_standings', true );

			$status = $has_rounds ? 'active' : 'planned';

			update_post_meta( $tournament_id, 'rc_category', 'mixed' );
			update_post_meta( $tournament_id, 'rc_status', $status );
			update_post_meta( $tournament_id, 'rc_format', 'round-robin' );
			update_post_meta( $tournament_id, 'rc_time_control', $time_control );
			update_post_meta( $tournament_id, 'rc_participants', wp_slash( $participants ?: '[]' ) );
			update_post_meta( $tournament_id, 'rc_rounds', wp_slash( $rounds_raw ?: '[]' ) );
			update_post_meta( $tournament_id, 'rc_ssf_group_id', $ssf_group_id );
			update_post_meta( $tournament_id, 'rc_event_id', 0 );
			update_post_meta( $tournament_id, 'rc_external_link', esc_url_raw( $tournament_link ) );
			update_post_meta( $tournament_id, 'rc_start_date', '' );
			update_post_meta( $tournament_id, 'rc_end_date', '' );
			update_post_meta( $tournament_id, 'rc_show_participants', '' === $show_participants ? '1' : ( (bool) $show_participants ? '1' : '0' ) );
			update_post_meta( $tournament_id, 'rc_show_standings', '' === $show_standings ? '1' : ( (bool) $show_standings ? '1' : '0' ) );

			update_post_meta( $group_id, 'rc_linked_tournament_id', $tournament_id );

			WP_CLI::success( sprintf( 'Created tournament #%d from group "%s" (ID %d)', $tournament_id, $group->post_title, $group_id ) );
			++$migrated;

			if ( 'tournament' === $group_type ) {
				WP_CLI::warning( sprintf( 'Group "%s" (ID %d) appears tournament-only. Consider deleting the group manually after verifying tournament #%d.', $group->post_title, $group_id, $tournament_id ) );
				++$warnings;
			}
		}

		WP_CLI::log( '' );
		WP_CLI::success( sprintf( '%sMigrated %d tournaments; %d skipped (already migrated); %d warnings.', $prefix, $migrated, $skipped, $warnings ) );
		if ( ! $dry_run ) {
			WP_CLI::log( 'Next: run `wp rockaden migrate-blocks` to rewrite standings blocks, then `wp rockaden cleanup-legacy-meta` once verified.' );
		}
	}

	/**
	 * `wp rockaden migrate-blocks [--dry-run]`
	 *
	 * Rewrite `wp:rockaden/standings {"groupId":N}` blocks in post content
	 * to `{"tournamentId":M}` using the rc_linked_tournament_id mapping
	 * produced by migrate-tournaments.
	 *
	 * @param array<int, string>    $args       Positional args (unused).
	 * @param array<string, string> $assoc_args Associative args.
	 */
	public static function migrate_blocks( array $args, array $assoc_args ): void {
		unset( $args );
		$dry_run = isset( $assoc_args['dry-run'] );
		$prefix  = $dry_run ? '[dry-run] ' : '';

		// Build {old_group_id => new_tournament_id} map.
		$map    = [];
		$groups = get_posts(
			[
				'post_type'      => TrainingGroup::POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- One-shot migration.
				'fields'         => 'ids',
			]
		);
		foreach ( $groups as $gid ) {
			$linked = (int) get_post_meta( (int) $gid, 'rc_linked_tournament_id', true );
			if ( $linked > 0 ) {
				$map[ (int) $gid ] = $linked;
			}
		}

		if ( empty( $map ) ) {
			WP_CLI::warning( 'No training groups have a linked tournament. Run `wp rockaden migrate-tournaments` first.' );
			return;
		}

		// Scan all posts/pages for the standings block.
		$candidates = get_posts(
			[
				'post_type'      => [ 'post', 'page' ],
				'post_status'    => 'any',
				'posts_per_page' => -1, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- One-shot migration.
				's'              => 'wp:rockaden/standings',
			]
		);

		$rewritten = 0;
		foreach ( $candidates as $post ) {
			$content = $post->post_content;
			if ( false === strpos( $content, 'wp:rockaden/standings' ) ) {
				continue;
			}

			$new_content = preg_replace_callback(
				'~<!--\s*wp:rockaden/standings\s+(\{[^}]*"groupId"\s*:\s*(\d+)[^}]*\})\s*/-->~',
				function ( $matches ) use ( $map, $post ) {
					$json   = $matches[1];
					$old_id = (int) $matches[2];
					if ( ! isset( $map[ $old_id ] ) ) {
						WP_CLI::warning( sprintf( 'Post "%s" (ID %d) references group #%d with no migration mapping — block left unchanged.', $post->post_title, $post->ID, $old_id ) );
						return $matches[0];
					}
					$new_id  = $map[ $old_id ];
					$decoded = json_decode( $json, true );
					if ( ! is_array( $decoded ) ) {
						return $matches[0];
					}
					unset( $decoded['groupId'] );
					$decoded['tournamentId'] = $new_id;
					$new_json                = wp_json_encode( $decoded );
					return '<!-- wp:rockaden/standings ' . $new_json . ' /-->';
				},
				$content
			);

			if ( null === $new_content || $new_content === $content ) {
				continue;
			}

			WP_CLI::log( sprintf( '%sRewrite standings block in "%s" (ID %d)', $prefix, $post->post_title, $post->ID ) );
			++$rewritten;

			if ( ! $dry_run ) {
				wp_update_post(
					[
						'ID'           => $post->ID,
						'post_content' => $new_content,
					]
				);
			}
		}

		WP_CLI::success( sprintf( '%sRewrote %d posts.', $prefix, $rewritten ) );
	}

	/**
	 * `wp rockaden cleanup-legacy-meta [--dry-run]`
	 *
	 * Delete legacy tournament-related meta rows from all training group
	 * posts. Run only after `migrate-tournaments` has been verified.
	 *
	 * @param array<int, string>    $args       Positional args (unused).
	 * @param array<string, string> $assoc_args Associative args.
	 */
	public static function cleanup_legacy_meta( array $args, array $assoc_args ): void {
		unset( $args );
		$dry_run = isset( $assoc_args['dry-run'] );
		$prefix  = $dry_run ? '[dry-run] ' : '';

		$groups = get_posts(
			[
				'post_type'      => TrainingGroup::POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- One-shot migration.
				'fields'         => 'ids',
			]
		);

		$deleted = 0;
		foreach ( $groups as $group_id ) {
			foreach ( self::LEGACY_META_KEYS as $key ) {
				$value     = get_post_meta( (int) $group_id, $key, true );
				$all_value = get_post_meta( (int) $group_id, $key, false );
				if ( '' === $value && empty( $all_value ) ) {
					continue;
				}
				WP_CLI::log( sprintf( '%sDelete %s on group #%d', $prefix, $key, $group_id ) );
				if ( ! $dry_run ) {
					delete_post_meta( (int) $group_id, $key );
				}
				++$deleted;
			}
		}

		WP_CLI::success( sprintf( '%sDeleted %d legacy meta rows across %d training groups.', $prefix, $deleted, count( $groups ) ) );
	}

	/**
	 * Collect participant IDs from the rc_participants JSON.
	 *
	 * @param string $participants_json Raw JSON string.
	 * @return array<int, string>
	 */
	private static function participant_ids_from_json( string $participants_json ): array {
		$decoded = json_decode( $participants_json ?: '[]', true );
		if ( ! is_array( $decoded ) ) {
			return [];
		}
		$ids = [];
		foreach ( $decoded as $p ) {
			if ( is_array( $p ) && isset( $p['id'] ) ) {
				$ids[] = (string) $p['id'];
			}
		}
		return $ids;
	}

	/**
	 * Find participant IDs referenced in rounds that are not in the participant list.
	 *
	 * @param array<int, array<string, mixed>> $rounds          Parsed rounds.
	 * @param array<int, string>               $participant_ids Known participant IDs.
	 * @return array<int, string>
	 */
	private static function find_orphan_refs( array $rounds, array $participant_ids ): array {
		$known   = array_flip( $participant_ids );
		$orphans = [];
		foreach ( $rounds as $round ) {
			$pairings = $round['pairings'] ?? [];
			if ( ! is_array( $pairings ) ) {
				continue;
			}
			foreach ( $pairings as $pairing ) {
				foreach ( [ 'whiteId', 'blackId' ] as $field ) {
					if ( isset( $pairing[ $field ] ) && ! isset( $known[ $pairing[ $field ] ] ) ) {
						$orphans[ (string) $pairing[ $field ] ] = true;
					}
				}
			}
			if ( isset( $round['bye'] ) && ! isset( $known[ $round['bye'] ] ) ) {
				$orphans[ (string) $round['bye'] ] = true;
			}
		}
		return array_keys( $orphans );
	}
}
