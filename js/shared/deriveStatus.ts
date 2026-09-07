import type { ExtraSession } from './recurrence';
// Client-side mirror of the server's StatusDeriver (PHP) so forms can preview
// what 'Automatic' resolves to. Local-midnight date compares.

export type DerivedStatus = 'planned' | 'active' | 'completed';

function parseLocalDate( value: string ): Date | null {
	const m = value.slice( 0, 10 ).match( /^(\d{4})-(\d{2})-(\d{2})$/ );
	return m
		? new Date( Number( m[ 1 ] ), Number( m[ 2 ] ) - 1, Number( m[ 3 ] ) )
		: null;
}

/**
 * Widen a schedule's start/end to cover any extra one-off dates.
 *
 * A group meeting on ad-hoc dates has no recurrence rule, so its event's own
 * end date is its *first* occurrence — deriving from that alone would call the
 * group "completed" the day after it started. Mirrors the same widening in
 * TrainingApi::format_group() so the admin's preview cannot disagree with the
 * status every other view shows.
 *
 * @param start         The schedule's start, or ''.
 * @param end           The effective end so far (series end, or the event's own).
 * @param includedDates Extra one-off dates, YYYY-MM-DD.
 * @return The widened range.
 */
export function widenForExtraDates(
	start: string,
	end: string,
	includedDates?: ExtraSession[] | null
): { start: string; end: string } {
	const extra = ( includedDates ?? [] )
		.map( ( entry ) =>
			typeof entry === 'string' ? entry : entry?.start ?? ''
		)
		.map( ( value ) => value.slice( 0, 10 ) )
		.filter( ( d ) => /^\d{4}-\d{2}-\d{2}$/.test( d ) );
	if ( ! extra.length ) {
		return { start, end };
	}

	const last = extra.reduce( ( a, b ) => ( a > b ? a : b ) );
	const first = extra.reduce( ( a, b ) => ( a < b ? a : b ) );
	const startKey = start.slice( 0, 10 );

	return {
		start: ! startKey || first < startKey ? first : start,
		end: end.slice( 0, 10 ) > last ? end : last,
	};
}

export function deriveStatus(
	start: string,
	end: string,
	hasResults: boolean,
	// For SSF-backed tournaments: the SSF state (1=registration, 2=started,
	// 3=finished) decides "not started" instead of the start date (group start
	// dates can be a registration window). Mirrors StatusDeriver::derive_from_ssf.
	ssfState?: number
): DerivedStatus {
	const today = new Date();
	today.setHours( 0, 0, 0, 0 );
	const endDate = parseLocalDate( end );
	if ( endDate && today > endDate ) {
		return 'completed';
	}
	if ( ssfState !== undefined ) {
		return ssfState === 1 ? 'planned' : 'active';
	}
	const startDate = parseLocalDate( start );
	if ( ! hasResults && ( ! startDate || today < startDate ) ) {
		return 'planned';
	}
	return 'active';
}
