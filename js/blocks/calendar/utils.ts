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
	// An overnight timed block (end falls on a later calendar day — e.g. a
	// 22:00–01:00 event that isn't promoted to a spanning bar) is clamped to
	// the end of the grid day so it doesn't compute a negative height.
	const endMin =
		endDate.substring( 0, 10 ) > startDate.substring( 0, 10 )
			? 24 * 60
			: end.hours * 60 + end.minutes;
	const durationHours = Math.max( 0, endMin - startMin ) / 60;
	return ( durationHours / TIME_GRID_HOURS ) * 100;
}

/**
 * Inverse of timeToPosition: percent (0–100) within the timegrid → hour/minute,
 * snapped to a given minute granularity. Used by the drag-to-select hook.
 * @param percent
 * @param snapMinutes
 */
export function positionToTime(
	percent: number,
	snapMinutes: number
): { hour: number; minute: number } {
	const clamped = Math.max( 0, Math.min( 100, percent ) );
	const totalMinutes =
		( clamped / 100 ) * TIME_GRID_HOURS * 60 + TIME_GRID_START * 60;
	const snapped = Math.round( totalMinutes / snapMinutes ) * snapMinutes;
	return { hour: Math.floor( snapped / 60 ), minute: snapped % 60 };
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

/* ── Multi-day spanning events ────────────────────────────── */

/**
 * Max spanning-bar lanes rendered in a month-view week row before the
 * remainder collapses into a row-level "+N more".
 */
export const MONTH_MAX_LANES = 3;

/** Spanning-bar lane height in px — keep in sync with CSS `--rc-month-lane-h`. */
export const MONTH_LANE_H = 18;

/**
 * An event ending at/before this hour on the day after it starts is treated
 * as a single-evening (overnight) block, not a multi-day spanning bar.
 */
export const OVERNIGHT_CUTOFF_HOUR = 6;

const MS_PER_DAY = 86400000;

/**
 * Parse a "YYYY-MM-DD" key into a local-midnight Date. Uses numeric Date args
 * (no string parsing) so there is no UTC/timezone shift.
 * @param key
 */
function keyToLocalDate( key: string ): Date {
	const [ y, m, d ] = key.split( '-' ).map( Number );
	return new Date( y, m - 1, d );
}

/**
 * Whole-day difference between two "YYYY-MM-DD" keys (endKey - startKey).
 * @param startKey
 * @param endKey
 */
export function dayDiff( startKey: string, endKey: string ): number {
	return Math.round(
		( keyToLocalDate( endKey ).getTime() -
			keyToLocalDate( startKey ).getTime() ) /
			MS_PER_DAY
	);
}

/**
 * True when an event should render as a horizontal multi-day spanning bar:
 * it ends on a later calendar date than it starts, EXCEPT a short overnight
 * (crosses exactly one midnight and ends at/before OVERNIGHT_CUTOFF_HOUR),
 * which stays a single timed block.
 * @param ev
 */
export function isSpanning( ev: CalendarEvent ): boolean {
	const startKey = ev.startDate.substring( 0, 10 );
	const endKey = ev.endDate.substring( 0, 10 );
	if ( endKey <= startKey ) {
		return false;
	}
	if ( dayDiff( startKey, endKey ) === 1 ) {
		const { hours, minutes } = parseTime( ev.endDate );
		if (
			hours < OVERNIGHT_CUTOFF_HOUR ||
			( hours === OVERNIGHT_CUTOFF_HOUR && minutes === 0 )
		) {
			return false;
		}
	}
	return true;
}

/**
 * Partition events into spanning (multi-day bars) and timed (single-day,
 * positioned in the hour grid / shown as month pills).
 * @param events
 */
export function splitEvents( events: CalendarEvent[] ): {
	spanning: CalendarEvent[];
	timed: CalendarEvent[];
} {
	const spanning: CalendarEvent[] = [];
	const timed: CalendarEvent[] = [];
	for ( const ev of events ) {
		if ( isSpanning( ev ) ) {
			spanning.push( ev );
		} else {
			timed.push( ev );
		}
	}
	return { spanning, timed };
}

/**
 * "YYYY-MM-DD" key for a grid cell (pure, no Date parsing).
 * @param cell
 */
export function cellKey( cell: GridCell ): string {
	const m = String( cell.month + 1 ).padStart( 2, '0' );
	const d = String( cell.day ).padStart( 2, '0' );
	return `${ cell.year }-${ m }-${ d }`;
}

/**
 * A spanning event clipped to a contiguous window of ordered day-keys
 * (a month week-row, or a week view's 7 days).
 */
export interface RowSegment {
	event: CalendarEvent;
	colOffset: number;
	colSpan: number;
	continuesLeft: boolean;
	continuesRight: boolean;
}

/**
 * Clip a spanning event to a window given as its ordered, contiguous day-keys.
 * Returns null when the event does not overlap the window. colOffset/colSpan
 * are derived from key positions — no date arithmetic.
 * @param ev
 * @param dayKeys Ordered contiguous "YYYY-MM-DD" keys (e.g. a 7-day week row).
 */
export function clipSpanToWindow(
	ev: CalendarEvent,
	dayKeys: string[]
): RowSegment | null {
	const startKey = ev.startDate.substring( 0, 10 );
	const endKey = ev.endDate.substring( 0, 10 );
	const windowStart = dayKeys[ 0 ];
	const windowEnd = dayKeys[ dayKeys.length - 1 ];
	if ( endKey < windowStart || startKey > windowEnd ) {
		return null;
	}
	const clampedStart = startKey < windowStart ? windowStart : startKey;
	const clampedEnd = endKey > windowEnd ? windowEnd : endKey;
	const colOffset = dayKeys.indexOf( clampedStart );
	const endIdx = dayKeys.indexOf( clampedEnd );
	if ( colOffset === -1 || endIdx === -1 ) {
		return null;
	}
	return {
		event: ev,
		colOffset,
		colSpan: endIdx - colOffset + 1,
		continuesLeft: startKey < windowStart,
		continuesRight: endKey > windowEnd,
	};
}

export interface PackedSegment extends RowSegment {
	laneIndex: number;
}

/**
 * Greedy lane-packing for a row of clipped segments: sort by start column
 * (longer spans first on ties), assign each to the first lane whose last
 * occupied column is before this segment's start.
 * @param segments
 */
export function packRow( segments: RowSegment[] ): PackedSegment[] {
	const sorted = [ ...segments ].sort(
		( a, b ) => a.colOffset - b.colOffset || b.colSpan - a.colSpan
	);
	const laneEndCol: number[] = [];
	const packed: PackedSegment[] = [];
	for ( const seg of sorted ) {
		let lane = 0;
		for ( ; lane < laneEndCol.length; lane++ ) {
			if ( laneEndCol[ lane ] < seg.colOffset ) {
				break;
			}
		}
		laneEndCol[ lane ] = seg.colOffset + seg.colSpan - 1;
		packed.push( { ...seg, laneIndex: lane } );
	}
	return packed;
}
