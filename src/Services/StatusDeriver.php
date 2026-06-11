<?php
/**
 * Lifecycle status derivation shared by tournaments and training groups.
 *
 * @package Rockaden
 */

namespace Rockaden\Services;

/**
 * Derives a planned/active/completed lifecycle status from start/end dates plus
 * a "has it started" ground-truth flag. Mirrors the sthlmschack-reimagined rule:
 * 'completed' is purely date-based (today past the end date — end-date inclusive);
 * 'planned' means not started yet (no results) and no start date or still before it;
 * otherwise 'active'. Dates compare at local midnight in the site timezone.
 */
class StatusDeriver {

	/**
	 * Derive the effective lifecycle status.
	 *
	 * @param string $start       Start date ('' if unset).
	 * @param string $end         End date ('' if unset).
	 * @param bool   $has_results Whether the thing has already started (e.g. round
	 *                            results exist). Pass false for purely date-based.
	 * @return string planned|active|completed
	 */
	public static function derive( string $start, string $end, bool $has_results ): string {
		$tz    = wp_timezone();
		$today = new \DateTimeImmutable( 'today', $tz );

		$end_date = self::parse_local_date( $end, $tz );
		if ( $end_date instanceof \DateTimeImmutable && $today > $end_date ) {
			return 'completed';
		}

		// Not started (no results) and either no start date yet or still before it.
		$start_date = self::parse_local_date( $start, $tz );
		if ( ! $has_results && ( null === $start_date || $today < $start_date ) ) {
			return 'planned';
		}

		return 'active';
	}

	/**
	 * Derive lifecycle status from live SSF data (state + end date). Mirrors the
	 * sthlmschack-reimagined rule: completed once today is past the end date;
	 * planned while the SSF state is REGISTRATION (1); otherwise active. The SSF
	 * state — not the start date — decides "not started" (group start dates can
	 * be a registration window well before play begins).
	 *
	 * @param string $end   Tournament end date ('' if unset).
	 * @param int    $state SSF state (1 = registration, 2 = started, 3 = finished).
	 * @return string planned|active|completed
	 */
	public static function derive_from_ssf( string $end, int $state ): string {
		$tz    = wp_timezone();
		$today = new \DateTimeImmutable( 'today', $tz );

		$end_date = self::parse_local_date( $end, $tz );
		if ( $end_date instanceof \DateTimeImmutable && $today > $end_date ) {
			return 'completed';
		}

		if ( 1 === $state ) {
			return 'planned';
		}

		return 'active';
	}

	/**
	 * Parse a date string as local midnight in the given timezone. Accepts
	 * 'YYYY-MM-DD' or a longer ISO string (the date part is used). Returns null
	 * on empty/invalid input.
	 *
	 * @param string        $value Date string.
	 * @param \DateTimeZone $tz    Timezone.
	 * @return \DateTimeImmutable|null
	 */
	private static function parse_local_date( string $value, \DateTimeZone $tz ): ?\DateTimeImmutable {
		$value = trim( $value );
		if ( '' === $value ) {
			return null;
		}
		$parsed = \DateTimeImmutable::createFromFormat( '!Y-m-d', substr( $value, 0, 10 ), $tz );
		return false === $parsed ? null : $parsed;
	}
}
