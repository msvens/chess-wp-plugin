<?php
/**
 * Documentation registry.
 *
 * Static registry for bundled documentation pages. Plugin and theme
 * register their doc entries here; the documentation block reads them.
 *
 * @package Rockaden
 */

namespace Rockaden\Docs;

defined( 'ABSPATH' ) || exit;

/**
 * Static registry for bundled documentation entries.
 */
class DocsRegistry {

	/**
	 * Registered doc entries keyed by slug.
	 *
	 * @var array<string, array{slug: string, title_sv: string, title_en: string, section_sv: string, section_en: string, file: string, order: int}>
	 */
	private static array $entries = [];

	/**
	 * Register a documentation entry.
	 *
	 * @param array{slug: string, title_sv: string, title_en: string, section_sv: string, section_en: string, file: string, order: int} $entry Doc entry.
	 */
	public static function register( array $entry ): void {
		if ( empty( $entry['slug'] ) || empty( $entry['file'] ) ) {
			return;
		}
		if ( ! file_exists( $entry['file'] ) ) {
			return;
		}
		self::$entries[ $entry['slug'] ] = $entry;
	}

	/**
	 * Get all entries sorted by section then order.
	 *
	 * @return array<int, array{slug: string, title_sv: string, title_en: string, section_sv: string, section_en: string, file: string, order: int}>
	 */
	public static function get_all(): array {
		$entries = array_values( self::$entries );
		usort(
			$entries,
			function ( array $a, array $b ): int {
				$section_cmp = strcmp( $a['section_sv'], $b['section_sv'] );
				if ( 0 !== $section_cmp ) {
					return $section_cmp;
				}
				return $a['order'] <=> $b['order'];
			}
		);
		return $entries;
	}

	/**
	 * Get entries grouped by section.
	 *
	 * @return array<string, array{title_sv: string, title_en: string, entries: array<int, array{slug: string, title_sv: string, title_en: string, file: string, order: int}>}>
	 */
	public static function get_sections(): array {
		$sections = [];
		foreach ( self::get_all() as $entry ) {
			$key = $entry['section_sv'];
			if ( ! isset( $sections[ $key ] ) ) {
				$sections[ $key ] = [
					'title_sv' => $entry['section_sv'],
					'title_en' => $entry['section_en'],
					'entries'  => [],
				];
			}
			$sections[ $key ]['entries'][] = $entry;
		}
		return $sections;
	}

	/**
	 * Look up an entry by slug.
	 *
	 * @param string $slug The doc slug.
	 * @return array{slug: string, title_sv: string, title_en: string, section_sv: string, section_en: string, file: string, order: int}|null
	 */
	public static function get_by_slug( string $slug ): ?array {
		return self::$entries[ $slug ] ?? null;
	}

	/**
	 * Get the slug of the first registered entry (default landing page).
	 */
	public static function get_default_slug(): string {
		$all = self::get_all();
		return ! empty( $all ) ? $all[0]['slug'] : '';
	}
}
