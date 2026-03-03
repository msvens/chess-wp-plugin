<?php
/**
 * SSF proxy REST API endpoint.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Proxies requests to the Swedish Chess Federation (SSF) API.
 */
class SsfProxy {

	private const SSF_BASE  = 'https://member.schack.se/public/api/v1';
	private const NAMESPACE = 'rockaden/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/ssf/(?P<path>.+)',
			[
				'methods'             => [ 'GET', 'POST' ],
				'callback'            => [ self::class, 'proxy' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * Proxy a request to the SSF API.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function proxy( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$path = $request->get_param( 'path' );
		$url  = self::SSF_BASE . '/' . ltrim( $path, '/' );

		// Forward query params for GET requests.
		$query_params = $request->get_query_params();
		unset( $query_params['rest_route'] ); // WP internal param.
		if ( ! empty( $query_params ) ) {
			$url .= '?' . http_build_query( $query_params );
		}

		$args = [
			'timeout' => 15,
			'headers' => [
				'Accept' => 'application/json',
			],
		];

		if ( 'POST' === $request->get_method() ) {
			$args['method']                  = 'POST';
			$args['body']                    = $request->get_body();
			$args['headers']['Content-Type'] = $request->get_content_type()['value'] ?? 'application/json';
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ssf_proxy_error',
				$response->get_error_message(),
				[ 'status' => 502 ]
			);
		}

		$status = wp_remote_retrieve_response_code( $response );
		$body   = wp_remote_retrieve_body( $response );
		$data   = json_decode( $body, true );

		return new WP_REST_Response( $data ?? $body, $status );
	}
}
