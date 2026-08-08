import type { Language } from './types';
import type { Translations } from './translations';

/**
 * The minimal recurring-schedule shape shared by a calendar EventData and a
 * training group's derived `schedule`. Both carry the same date/recurrence
 * fields, so one formatter serves both.
 */
export interface ScheduleSource {
	startDate: string;
	endDate: string;
	isRecurring: boolean;
	recurrenceType: string | null;
	location?: string;
	// Series end (date-only YYYY-MM-DD); empty/absent = no end date.
	recurrenceEndDate?: string;
	// Occurrences the editor removed from the series (YYYY-MM-DD).
	excludedDates?: string[];
}

// Above this many occurrences an explicit date list stops being readable (a
// year-round weekly training is 40+ dates), so we state the rule and the series
// range instead. Tournaments — typically one date per round — stay under it.
// Phones fit roughly 38 characters per line — around 8 dates over two lines —
// so they cut over sooner.
export const MAX_LISTED_DATES = 12;
export const MAX_LISTED_DATES_NARROW = 8;

// Runaway guard: a bounded series is inherently finite, but a misconfigured
// recurrence-end decades out shouldn't spin.
const SERIES_CAP = 500;

// Extract a literal HH:mm from a naive site-local datetime string. We read the
// digits directly (no `new Date()`) so a stored local time is never shifted by
// the browser's timezone.
function extractTime( dateStr: string ): string {
	const match = dateStr.match( /(\d{2}):(\d{2})/ );
	return match ? `${ match[ 1 ] }:${ match[ 2 ] }` : '';
}

// Same reasoning as extractTime: read the site-local date off the string rather
// than through `new Date()`, which would resolve it in the visitor's timezone
// and could shift every occurrence by a day.
function extractDateKey( dateStr: string ): string {
	const match = dateStr.match( /^(\d{4})-(\d{2})-(\d{2})/ );
	return match ? `${ match[ 1 ] }-${ match[ 2 ] }-${ match[ 3 ] }` : '';
}

function keyToUtcMs( key: string ): number {
	const [ y, m, d ] = key.split( '-' ).map( Number );
	return Date.UTC( y, m - 1, d );
}

/**
 * The schedule's real occurrence dates (YYYY-MM-DD), with removed weeks left out.
 *
 * Returns an empty array for an open-ended series, which has no finite list to
 * show — callers fall back to restating the recurrence rule.
 *
 * @param source The event/schedule to expand.
 */
export function occurrenceDates( source: ScheduleSource ): string[] {
	const excluded = new Set( source.excludedDates ?? [] );
	return seriesDates( source ).filter( ( key ) => ! excluded.has( key ) );
}

/**
 * Every date the recurrence rule generates, ignoring exclusions.
 *
 * @param source The event/schedule to expand.
 */
function seriesDates( source: ScheduleSource ): string[] {
	const startKey = extractDateKey( source.startDate );
	if ( ! startKey ) {
		return [];
	}
	if ( ! source.isRecurring || ! source.recurrenceType ) {
		return [ startKey ];
	}

	const endKey = extractDateKey( source.recurrenceEndDate ?? '' );
	if ( ! endKey ) {
		return [];
	}

	const stepMs = ( source.recurrenceType === 'biweekly' ? 14 : 7 ) * 86400000;
	const endMs = keyToUtcMs( endKey );
	const dates: string[] = [];

	// Step in UTC so a daylight-saving transition mid-series can't shift a date.
	let cursor = keyToUtcMs( startKey );
	while ( cursor <= endMs && dates.length < SERIES_CAP ) {
		dates.push( new Date( cursor ).toISOString().substring( 0, 10 ) );
		cursor += stepMs;
	}
	return dates;
}

/**
 * The removed weeks that actually fall on a generated occurrence.
 *
 * Exclusions can go stale — change an event's weekday and the stored dates no
 * longer line up with anything. Those are silently dropped rather than reported
 * as skipped weeks that never existed.
 *
 * @param source The event/schedule to expand.
 */
export function excludedOccurrences( source: ScheduleSource ): string[] {
	const excluded = new Set( source.excludedDates ?? [] );
	return seriesDates( source ).filter( ( key ) => excluded.has( key ) );
}

// A single date key as "17/9" (sv) / "17/09" (en).
function formatDateKey( key: string, lang: Language ): string {
	const loc = lang === 'sv' ? 'sv-SE' : 'en-GB';
	return new Date( keyToUtcMs( key ) ).toLocaleDateString( loc, {
		day: 'numeric',
		month: 'numeric',
		timeZone: 'UTC',
	} );
}

/**
 * The occurrence dates as a short list, e.g. "17/9, 1/10, 15/10".
 *
 * Null when there is no meaningful list (open-ended series, or a single date —
 * a one-off needs no date list, its weekday line already says everything).
 *
 * @param source The event/schedule to expand.
 * @param lang   UI language (drives the date locale).
 */
export function formatScheduleDates(
	source: ScheduleSource,
	lang: Language
): string | null {
	const dates = occurrenceDates( source );
	if ( dates.length < 2 ) {
		return null;
	}
	return dates.map( ( key ) => formatDateKey( key, lang ) ).join( ', ' );
}

/**
 * A schedule rendered as two lines, so a long date list wraps as a block rather
 * than stranding the time halfway through a row of dates.
 */
export interface ScheduleDisplay {
	primary: string;
	secondary?: string;
}

/**
 * The full schedule for a detail page.
 *
 * A short series lists its real dates (removed weeks already gone); a long one
 * would be an unreadable wall of dates on a phone, so it states the rule, the
 * span, and which weeks are skipped.
 *
 * @param source   The event/schedule to format.
 * @param lang     UI language.
 * @param t        The `training` translation block.
 * @param maxDates How many dates may be listed before falling back to the rule.
 */
export function formatScheduleDetail(
	source: ScheduleSource,
	lang: Language,
	t: Translations[ 'training' ],
	maxDates: number = MAX_LISTED_DATES
): ScheduleDisplay {
	const dates = occurrenceDates( source );

	// Few enough to read: dates first, then time and place.
	if ( dates.length >= 2 && dates.length <= maxDates ) {
		const time = formatScheduleTime( source );
		return {
			primary: dates
				.map( ( key ) => formatDateKey( key, lang ) )
				.join( ', ' ),
			secondary: time ? `${ t.time } ${ time }` : undefined,
		};
	}

	const rule = formatSchedule( source, lang, t );

	// Open-ended or one-off: the rule is all there is to say.
	if ( dates.length < 2 ) {
		return { primary: rule };
	}

	// Long series: span, plus the weeks actually removed from it.
	const span = `${ formatDateKey( dates[ 0 ], lang ) }–${ formatDateKey(
		dates[ dates.length - 1 ],
		lang
	) }`;
	const skipped = excludedOccurrences( source ).map( ( key ) =>
		formatDateKey( key, lang )
	);
	const except = skipped.length
		? ` (${ t.except } ${ skipped.join( ', ' ) })`
		: '';

	return { primary: rule, secondary: `${ span }${ except }` };
}

/**
 * The time (and location) half of a schedule, e.g. "18:00–20:00, Klubblokalen".
 * Used alongside a date list, where the weekday prefix would be redundant.
 *
 * @param source          The event/schedule to format.
 * @param includeLocation Append the location when present (default true).
 */
export function formatScheduleTime(
	source: ScheduleSource,
	includeLocation = true
): string {
	const timeStart = extractTime( source.startDate );
	const timeEnd = extractTime( source.endDate );
	const parts = [];
	if ( timeStart && timeEnd ) {
		parts.push( `${ timeStart }–${ timeEnd }` );
	}
	if ( includeLocation && source.location ) {
		parts.push( source.location );
	}
	return parts.join( ', ' );
}

/**
 * Render a human schedule string, e.g. "Every week tuesday 18:30–21:00, Klubblokalen".
 *
 * @param source          The event/schedule to format.
 * @param lang            UI language (drives the weekday locale).
 * @param t               The `training` translation block (recurrence labels).
 * @param includeLocation Append the location when present (default true).
 */
export function formatSchedule(
	source: ScheduleSource,
	lang: Language,
	t: Translations[ 'training' ],
	includeLocation = true
): string {
	const start = new Date( source.startDate );
	const loc = lang === 'sv' ? 'sv-SE' : 'en-US';
	const weekday = start.toLocaleDateString( loc, { weekday: 'long' } );

	const timeStart = extractTime( source.startDate );
	const timeEnd = extractTime( source.endDate );

	const prefix =
		source.recurrenceType === 'biweekly'
			? t.everyOtherWeek
			: source.isRecurring
			? t.everyWeek
			: '';

	const dayStr = prefix
		? `${ prefix } ${ weekday.toLowerCase() }`
		: weekday.charAt( 0 ).toUpperCase() + weekday.slice( 1 );

	const parts = [ `${ dayStr } ${ timeStart }–${ timeEnd }` ];
	if ( includeLocation && source.location ) {
		parts.push( source.location );
	}
	return parts.join( ', ' );
}
