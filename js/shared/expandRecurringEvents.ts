import type { ExtraSession } from './recurrence';
import {
	extractDateKey,
	keyToUtcMs,
	occurrences,
	seriesDateKeys,
} from './recurrence';
import type { CalendarEvent, EventCategory } from './types';

export interface EventDoc {
	id: number | string;
	title: string;
	startDate: string;
	endDate: string;
	description?: string | null;
	location?: string | null;
	category?: string | null;
	link?: string | null;
	linkLabel?: string | null;
	isRecurring?: boolean | null;
	recurrenceType?: 'weekly' | 'biweekly' | null;
	recurrenceEndDate?: string | null;
	excludedDates?: string[] | null;
	// Extra sessions, each optionally carrying its own start and end.
	includedDates?: ExtraSession[] | null;
}

// Parse a naive site-local datetime ("2026-10-12T18:00:00") into a Date using
// local components, never through the string's own offset.
function localDate( value: string ): Date {
	const [ datePart, timePart = '00:00:00' ] = value.split( 'T' );
	const [ y, m, d ] = datePart.split( '-' ).map( Number );
	const [ hh, mm, ss ] = timePart.split( ':' ).map( Number );
	return new Date( y, m - 1, d, hh || 0, mm || 0, ss || 0 );
}

// The given date at another date's wall-clock time.
function atTimeOf( dateKey: string, source: Date ): Date {
	const [ y, m, d ] = dateKey.split( '-' ).map( Number );
	return new Date(
		y,
		m - 1,
		d,
		source.getHours(),
		source.getMinutes(),
		source.getSeconds()
	);
}

export function expandRecurringEvents( docs: EventDoc[] ): CalendarEvent[] {
	const result: CalendarEvent[] = [];

	for ( const doc of docs ) {
		const id = String( doc.id );
		const base: Omit<
			CalendarEvent,
			'id' | 'startDate' | 'endDate' | 'parentId'
		> = {
			title: doc.title,
			description: doc.description ?? undefined,
			location: doc.location ?? undefined,
			category: ( doc.category as EventCategory ) || 'other',
			source: 'cms',
			link: doc.link ?? undefined,
			linkLabel: doc.linkLabel ?? undefined,
		};

		const hasRule = Boolean( doc.isRecurring && doc.recurrenceType );
		const hasExtraDates = ( doc.includedDates ?? [] ).length > 0;

		// A plain one-off event, with no rule and no extra dates, is emitted as
		// itself — no expansion, and its own id rather than a dated one.
		if ( ! hasRule && ! hasExtraDates ) {
			result.push( {
				...base,
				id,
				startDate: doc.startDate,
				endDate: doc.endDate,
			} );
			continue;
		}

		const start = new Date( doc.startDate );
		const end = new Date( doc.endDate );

		// Duration = time-of-day difference only (so an overloaded multi-month
		// endDate from legacy data doesn't inflate the occurrence length)
		const startTimeMs =
			( start.getHours() * 3600 +
				start.getMinutes() * 60 +
				start.getSeconds() ) *
			1000;
		const endTimeMs =
			( end.getHours() * 3600 +
				end.getMinutes() * 60 +
				end.getSeconds() ) *
			1000;
		const durationMs = endTimeMs - startTimeMs;

		// Series boundary: the explicit recurrence-end date when set; otherwise
		// an unbounded series is capped at a 12-month horizon from the start.
		const startKey = extractDateKey( doc.startDate );
		let endKey = extractDateKey( doc.recurrenceEndDate ?? '' );
		if ( ! endKey ) {
			const horizon = new Date( keyToUtcMs( startKey ) );
			horizon.setUTCMonth( horizon.getUTCMonth() + 12 );
			endKey = horizon.toISOString().substring( 0, 10 );
		}

		const stepDays = doc.recurrenceType === 'biweekly' ? 14 : 7;
		const ruleKeys = hasRule
			? seriesDateKeys( startKey, stepDays, endKey )
			: [ startKey ];

		for ( const occ of occurrences(
			ruleKeys,
			doc.includedDates,
			doc.excludedDates
		) ) {
			// An extra session states its own times; anything else takes the
			// event's. Both are built from local date components, which is what
			// keeps 18:00 meaning 18:00 across a daylight-saving change —
			// reattaching a stored UTC offset instead would carry a summer
			// offset into winter and shift every later occurrence by an hour.
			const occurrenceStart = occ.start
				? localDate( occ.start )
				: atTimeOf( occ.dateKey, start );

			const occurrenceEnd = occ.end
				? localDate( occ.end )
				: new Date( occurrenceStart.getTime() + durationMs );

			result.push( {
				...base,
				id: `${ id }-${ occ.dateKey }`,
				parentId: id,
				startDate: occurrenceStart.toISOString(),
				endDate: occurrenceEnd.toISOString(),
			} );
		}
	}

	return result;
}
