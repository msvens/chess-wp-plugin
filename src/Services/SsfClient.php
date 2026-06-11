<?php
/**
 * Cached read client for the SSF (member.schack.se) public API.
 *
 * @package Rockaden
 */

namespace Rockaden\Services;

/**
 * Thin GET wrapper around the SSF public API with a short transient cache, so
 * server-side reads (e.g. live status derivation) don't hit member.schack.se on
 * every request. Only successful (200 + decodable) responses are cached;
 * failures return null so the caller can fall back to a stored snapshot.
 */
class SsfClient {

	private const BASE = 'https://member.schack.se/public/api/v1';

	private const CACHE_PREFIX = 'rockaden_ssf_v1_';

	/**
	 * Cache TTL for tournament status reads, in seconds.
	 */
	public const STATUS_TTL = 600;

	/**
	 * GET a JSON path from the SSF API, cached as a transient.
	 *
	 * @param string $path API path relative to the base (leading slash optional).
	 * @param int    $ttl  Cache lifetime in seconds.
	 * @return array<string, mixed>|null Decoded body, or null on any failure.
	 */
	public static function get_json( string $path, int $ttl ): ?array {
		$path = ltrim( $path, '/' );
		$key  = self::CACHE_PREFIX . md5( $path );

		$cached = get_transient( $key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = wp_remote_get(
			self::BASE . '/' . $path,
			[
				'timeout' => 8,
				'headers' => [ 'Accept' => 'application/json' ],
			]
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}
		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return null;
		}

		set_transient( $key, $data, $ttl );
		return $data;
	}

	/**
	 * Fetch the parent tournament for an SSF group id. Despite the path, this
	 * endpoint returns the parent tournament (state, dates, name, thinkingTime,
	 * rootClasses[].groups[]), not a bare group.
	 *
	 * @param int $group_id SSF group id.
	 * @return array<string, mixed>|null
	 */
	public static function get_tournament_for_group( int $group_id ): ?array {
		return self::get_json( "tournament/group/id/{$group_id}", self::STATUS_TTL );
	}
}
