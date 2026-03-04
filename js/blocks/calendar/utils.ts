import type {
	CalendarEvent,
	EventCategory,
	Language,
} from '../../shared/types';

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
 * Derive Language from WP locale string
 * @param locale
 */
export function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
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
 * "14:00" from an ISO date string
 * @param dateStr
 * @param locale
 */
export function formatTime( dateStr: string, locale: string ): string {
	const date = new Date( dateStr );
	return date.toLocaleTimeString( toLocaleTag( locale ), {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	} );
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
