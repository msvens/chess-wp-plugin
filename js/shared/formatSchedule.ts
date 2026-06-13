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
}

// Extract a literal HH:mm from a naive site-local datetime string. We read the
// digits directly (no `new Date()`) so a stored local time is never shifted by
// the browser's timezone.
function extractTime( dateStr: string ): string {
	const match = dateStr.match( /(\d{2}):(\d{2})/ );
	return match ? `${ match[ 1 ] }:${ match[ 2 ] }` : '';
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
