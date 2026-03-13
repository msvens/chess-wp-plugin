import type { CalendarEvent, EventCategory } from '../../shared/types';

/* ── View mode ────────────────────────────────────────────── */

export type ViewMode = 'month' | 'week' | 'day';

/* ── Shared types ────────────────────────────────────────── */

export interface EventGroupLink {
	slug: string;
	title: string;
}

/* ── Category styling ─────────────────────────────────────── */

export const categoryOrder: EventCategory[] = [
	'training',
	'tournament',
	'junior',
	'allsvenskan',
	'skolschack',
	'other',
];

/** CSS class suffix per category — used as rc-cal-cat--{key} */
export const categoryClassMap: Record< EventCategory, string > = {
	training: 'training',
	tournament: 'tournament',
	junior: 'junior',
	allsvenskan: 'allsvenskan',
	skolschack: 'skolschack',
	other: 'other',
};

/* ── Date grid ────────────────────────────────────────────── */

export interface GridCell {
	day: number;
	month: number; // 0-indexed
	year: number;
	isCurrentMonth: boolean;
}

/**
 * Build a Mon-first 7×N grid for a given month.
 * Pads with days from previous/next month.
 * @param year
 * @param month
 */
export function buildGrid( year: number, month: number ): GridCell[] {
	const cells: GridCell[] = [];

	// First day of the month (0=Sun … 6=Sat → convert to Mon-first: 0=Mon … 6=Sun)
	const firstDay = new Date( year, month, 1 ).getDay();
	const startOffset = firstDay === 0 ? 6 : firstDay - 1;

	const daysInMonth = new Date( year, month + 1, 0 ).getDate();
	const daysInPrev = new Date( year, month, 0 ).getDate();

	// Previous month padding
	for ( let i = startOffset - 1; i >= 0; i-- ) {
		const d = daysInPrev - i;
		const m = month === 0 ? 11 : month - 1;
		const y = month === 0 ? year - 1 : year;
		cells.push( { day: d, month: m, year: y, isCurrentMonth: false } );
	}

	// Current month
	for ( let d = 1; d <= daysInMonth; d++ ) {
		cells.push( { day: d, month, year, isCurrentMonth: true } );
	}

	// Next month padding (fill to complete last row)
	const remaining = 7 - ( cells.length % 7 );
	if ( remaining < 7 ) {
		for ( let d = 1; d <= remaining; d++ ) {
			const m = month === 11 ? 0 : month + 1;
			const y = month === 11 ? year + 1 : year;
			cells.push( { day: d, month: m, year: y, isCurrentMonth: false } );
		}
	}

	return cells;
}

/* ── Event grouping ───────────────────────────────────────── */

/**
 * Group events by day-of-month for the given year/month.
 * Returns a map from day number (1-31) to events on that day.
 * @param events
 * @param year
 * @param month
 */
export function groupEventsByDay(
	events: CalendarEvent[],
	year: number,
	month: number
): Record< number, CalendarEvent[] > {
	const grouped: Record< number, CalendarEvent[] > = {};

	for ( const event of events ) {
		const start = new Date( event.startDate );
		if ( start.getFullYear() === year && start.getMonth() === month ) {
			const day = start.getDate();
			if ( ! grouped[ day ] ) {
				grouped[ day ] = [];
			}
			grouped[ day ].push( event );
		}
	}

	return grouped;
}

/* ── Locale / format helpers ──────────────────────────────── */

/**
 * Convert WP locale like "sv_SE" to BCP47 "sv-SE"
 * @param locale
 */
export function toLocaleTag( locale: string ): string {
	return locale.replace( '_', '-' );
}

/**
 * "mars 2026" or "March 2026"
 * @param year
 * @param month
 * @param locale
 */
export function formatMonthYear(
	year: number,
	month: number,
	locale: string
): string {
	const date = new Date( year, month, 1 );
	return date.toLocaleDateString( toLocaleTag( locale ), {
		month: 'long',
		year: 'numeric',
	} );
}

/**
 * "måndag 3 mars" or "Monday, March 3"
 * @param year
 * @param month
 * @param day
 * @param locale
 */
export function formatFullDate(
	year: number,
	month: number,
	day: number,
	locale: string
): string {
	const date = new Date( year, month, day );
	return date.toLocaleDateString( toLocaleTag( locale ), {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	} );
}

/**
 * "14:00" from a date string. Extracts HH:mm directly to avoid timezone
 * conversion issues (dates are stored in site-local time).
 *
 * @param dateStr
 */
export function formatTime( dateStr: string ): string {
	const match = dateStr.match( /T?(\d{2}):(\d{2})/ );
	return match ? `${ match[ 1 ] }:${ match[ 2 ] }` : '';
}

/**
 * Check if a date is today
 * @param year
 * @param month
 * @param day
 */
export function isToday( year: number, month: number, day: number ): boolean {
	const now = new Date();
	return (
		now.getFullYear() === year &&
		now.getMonth() === month &&
		now.getDate() === day
	);
}

/* ── Time grid constants ─────────────────────────────────── */

export const TIME_GRID_START = 7;
export const TIME_GRID_END = 22;
export const TIME_GRID_HOURS = TIME_GRID_END - TIME_GRID_START;

/* ── Week / day helpers ──────────────────────────────────── */

/**
 * Get Monday of the week containing the given date.
 * @param date
 */
export function getMonday( date: Date ): Date {
	const d = new Date( date.getFullYear(), date.getMonth(), date.getDate() );
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate( d.getDate() + diff );
	return d;
}

/**
 * Get array of 7 dates (Mon–Sun) for the week containing date.
 * @param date
 */
export function getWeekDates( date: Date ): Date[] {
	const monday = getMonday( date );
	const dates: Date[] = [];
	for ( let i = 0; i < 7; i++ ) {
		const d = new Date( monday );
		d.setDate( monday.getDate() + i );
		dates.push( d );
	}
	return dates;
}

/**
 * Format week range header — "10–16 mar 2026" or "28 mar – 3 apr 2026"
 * @param dates
 * @param locale
 */
export function formatWeekRange( dates: Date[], locale: string ): string {
	const tag = toLocaleTag( locale );
	const first = dates[ 0 ];
	const last = dates[ 6 ];

	if (
		first.getMonth() === last.getMonth() &&
		first.getFullYear() === last.getFullYear()
	) {
		const monthStr = first.toLocaleDateString( tag, { month: 'short' } );
		const yearStr = first.getFullYear();
		return `${ first.getDate() }–${ last.getDate() } ${ monthStr } ${ yearStr }`;
	}

	if ( first.getFullYear() === last.getFullYear() ) {
		const m1 = first.toLocaleDateString( tag, { month: 'short' } );
		const m2 = last.toLocaleDateString( tag, { month: 'short' } );
		return `${ first.getDate() } ${ m1 } – ${ last.getDate() } ${ m2 } ${ first.getFullYear() }`;
	}

	const f = first.toLocaleDateString( tag, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	} );
	const l = last.toLocaleDateString( tag, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	} );
	return `${ f } – ${ l }`;
}

/**
 * Format day view title — "tisdag 11 mars 2026"
 * @param date
 * @param locale
 */
export function formatDayTitle( date: Date, locale: string ): string {
	return date.toLocaleDateString( toLocaleTag( locale ), {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	} );
}

/**
 * Parse hours and minutes from an ISO date string via regex
 * (avoids timezone issues with new Date()).
 * @param dateStr
 */
function parseTime( dateStr: string ): { hours: number; minutes: number } {
	const match = dateStr.match( /T?(\d{2}):(\d{2})/ );
	if ( ! match ) {
		return { hours: 0, minutes: 0 };
	}
	return {
		hours: parseInt( match[ 1 ], 10 ),
		minutes: parseInt( match[ 2 ], 10 ),
	};
}

/**
 * Percentage top offset for an event in the time grid.
 * @param dateStr
 */
export function timeToPosition( dateStr: string ): number {
	const { hours, minutes } = parseTime( dateStr );
	const offset = hours - TIME_GRID_START + minutes / 60;
	return ( Math.max( 0, offset ) / TIME_GRID_HOURS ) * 100;
}

/**
 * Percentage height for an event block in the time grid.
 * @param startDate
 * @param endDate
 */
export function durationToHeight( startDate: string, endDate: string ): number {
	const start = parseTime( startDate );
	const end = parseTime( endDate );
	const startMin = start.hours * 60 + start.minutes;
	const endMin = end.hours * 60 + end.minutes;
	const durationHours = Math.max( 0, endMin - startMin ) / 60;
	return ( durationHours / TIME_GRID_HOURS ) * 100;
}

/**
 * Format date as YYYY-MM-DD key.
 * @param date
 */
export function dateKey( date: Date ): string {
	const y = date.getFullYear();
	const m = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const d = String( date.getDate() ).padStart( 2, '0' );
	return `${ y }-${ m }-${ d }`;
}

/**
 * Group events by "YYYY-MM-DD" key from their startDate.
 * @param events
 */
export function groupEventsByDate(
	events: CalendarEvent[]
): Record< string, CalendarEvent[] > {
	const grouped: Record< string, CalendarEvent[] > = {};
	for ( const event of events ) {
		// Extract date part from ISO string directly
		const key = event.startDate.substring( 0, 10 );
		if ( ! grouped[ key ] ) {
			grouped[ key ] = [];
		}
		grouped[ key ].push( event );
	}
	return grouped;
}

/**
 * Layout overlapping events into columns for the time grid.
 * Greedy column assignment — sort by start time, assign first non-overlapping column.
 */
export interface LayoutSlot {
	event: CalendarEvent;
	column: number;
	totalColumns: number;
}

export function layoutEvents( events: CalendarEvent[] ): LayoutSlot[] {
	if ( events.length === 0 ) {
		return [];
	}

	const sorted = [ ...events ].sort( ( a, b ) => {
		if ( a.startDate < b.startDate ) {
			return -1;
		}
		if ( a.startDate > b.startDate ) {
			return 1;
		}
		return 0;
	} );

	// Each column tracks the end time of its last event
	const columns: string[] = [];
	const assignments: { event: CalendarEvent; column: number }[] = [];

	for ( const event of sorted ) {
		let placed = false;
		for ( let col = 0; col < columns.length; col++ ) {
			if ( event.startDate >= columns[ col ] ) {
				columns[ col ] = event.endDate;
				assignments.push( { event, column: col } );
				placed = true;
				break;
			}
		}
		if ( ! placed ) {
			assignments.push( { event, column: columns.length } );
			columns.push( event.endDate );
		}
	}

	const totalColumns = columns.length;
	return assignments.map( ( a ) => ( {
		event: a.event,
		column: a.column,
		totalColumns,
	} ) );
}
