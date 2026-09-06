/**
 * Recurrence date arithmetic, shared by everything that expands an event.
 *
 * There were two copies of this, and they disagreed. formatSchedule.ts read the
 * date off the string and stepped in UTC; expandRecurringEvents.ts went through
 * `new Date()` and local getters, so a late-evening occurrence could land on the
 * wrong day for a visitor in another timezone — precisely what the comments in
 * formatSchedule.ts warn against. One implementation removes the question.
 *
 * Dates here are "date keys": literal YYYY-MM-DD strings in the site's own
 * timezone, never Date objects. A stored time like 2026-09-17T18:00:00+02:00 is
 * site-local by construction, so reading the digits off it is correct where
 * resolving it through the visitor's clock is not.
 */

// Runaway guard: a bounded series is inherently finite, but a misconfigured
// recurrence-end decades out shouldn't spin.
export const SERIES_CAP = 500;

/**
 * The literal site-local date from a datetime string, as YYYY-MM-DD.
 *
 * Read off the string rather than through `new Date()`, which would resolve it
 * in the visitor's timezone and could shift the date by a day.
 *
 * @param dateStr A datetime string, or anything else.
 * @return The date key, or '' when the string has no leading date.
 */
export function extractDateKey( dateStr: string ): string {
	const match = dateStr.match( /^(\d{4})-(\d{2})-(\d{2})/ );
	return match ? `${ match[ 1 ] }-${ match[ 2 ] }-${ match[ 3 ] }` : '';
}

/**
 * The literal HH:mm from a datetime string, for the same reason.
 *
 * @param dateStr A datetime string.
 * @return The time, or '' when absent.
 */
export function extractTime( dateStr: string ): string {
	const match = dateStr.match( /(\d{2}):(\d{2})/ );
	return match ? `${ match[ 1 ] }:${ match[ 2 ] }` : '';
}

/**
 * A date key as UTC milliseconds, for arithmetic only.
 *
 * UTC because stepping there cannot be perturbed by a daylight-saving
 * transition partway through a series.
 *
 * @param key A YYYY-MM-DD date key.
 * @return Milliseconds since the epoch at UTC midnight.
 */
export function keyToUtcMs( key: string ): number {
	const [ y, m, d ] = key.split( '-' ).map( Number );
	return Date.UTC( y, m - 1, d );
}

/**
 * Every date a recurrence rule generates, inclusive of both ends.
 *
 * Knows nothing about exclusions, extra dates, or what to do with an unbounded
 * series — callers decide the horizon by choosing what to pass as endKey, since
 * they disagree about it: a date *list* has nothing to show for an open-ended
 * series, while a *calendar* still wants a year of it.
 *
 * @param startKey First occurrence, YYYY-MM-DD.
 * @param stepDays Days between occurrences (7 weekly, 14 biweekly).
 * @param endKey   Last date to consider, YYYY-MM-DD.
 * @param cap      Maximum number of dates to generate.
 * @return Date keys in chronological order.
 */
export function seriesDateKeys(
	startKey: string,
	stepDays: number,
	endKey: string,
	cap: number = SERIES_CAP
): string[] {
	if ( ! startKey || ! endKey ) {
		return [];
	}

	const stepMs = stepDays * 86400000;
	const endMs = keyToUtcMs( endKey );
	const keys: string[] = [];

	let cursor = keyToUtcMs( startKey );
	while ( cursor <= endMs && keys.length < cap ) {
		keys.push( new Date( cursor ).toISOString().substring( 0, 10 ) );
		cursor += stepMs;
	}
	return keys;
}
