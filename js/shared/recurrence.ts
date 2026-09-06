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

/**
 * One occurrence of an event.
 *
 * `start` and `end` are present only for an extra session that carries its own
 * times; a date produced by the recurrence rule has neither, and the caller
 * applies the event's own time to it.
 */
export interface Occurrence {
	dateKey: string;
	start?: string;
	end?: string;
}

/**
 * An extra session, as stored.
 *
 * A period carries its own start and end — RDATE's PERIOD value type. A bare
 * string is the DATE form: the session happens on that day at the event's usual
 * time. Both are the spec's, and the second is worth keeping because "same time
 * as always" should not require filling in two pickers.
 */
export type ExtraSession = string | { start: string; end?: string };

/**
 * The complete set of occurrences an event has.
 *
 * Follows RFC 5545: the rule's dates plus the extra sessions, minus the
 * excluded ones — so an exclusion always wins, and a date named by both the
 * rule and an extra session is one occurrence, taking the session's own times.
 *
 * An event with extra sessions and no rule is the point of this: a group
 * meeting on unpredictable days has a list and no rule to state.
 *
 * @param ruleKeys      Dates the recurrence rule generated (may be empty).
 * @param extraSessions Extra sessions, as periods or bare dates.
 * @param excludedDates Cancelled dates, YYYY-MM-DD.
 * @return Occurrences, chronological and without duplicates.
 */
export function occurrences(
	ruleKeys: string[],
	extraSessions?: ExtraSession[] | null,
	excludedDates?: string[] | null
): Occurrence[] {
	const excluded = new Set( excludedDates ?? [] );
	const byKey = new Map< string, Occurrence >();

	for ( const dateKey of ruleKeys ) {
		if ( ! excluded.has( dateKey ) ) {
			byKey.set( dateKey, { dateKey } );
		}
	}

	for ( const entry of extraSessions ?? [] ) {
		const start = typeof entry === 'string' ? entry : entry?.start;
		if ( typeof start !== 'string' ) {
			continue;
		}
		const dateKey = extractDateKey( start );
		// Ignore anything that isn't a date rather than letting it through to be
		// rendered as an occurrence on a day that doesn't exist.
		if ( ! dateKey || excluded.has( dateKey ) ) {
			continue;
		}
		// An extra session with its own times wins over the rule's plain date:
		// naming a date explicitly is how you say it differs.
		byKey.set(
			dateKey,
			typeof entry === 'string'
				? { dateKey }
				: { dateKey, start: entry.start, end: entry.end }
		);
	}

	return [ ...byKey.values() ].sort( ( a, b ) =>
		a.dateKey < b.dateKey ? -1 : 1
	);
}
