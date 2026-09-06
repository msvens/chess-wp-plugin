import { extractDateKey, keyToUtcMs, seriesDateKeys } from './recurrence';
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

		if ( ! doc.isRecurring || ! doc.recurrenceType ) {
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
		const excluded = new Set( doc.excludedDates ?? [] );

		for ( const dateKey of seriesDateKeys( startKey, stepDays, endKey ) ) {
			if ( excluded.has( dateKey ) ) {
				continue;
			}
			// Build each occurrence at the event's wall-clock time on its own
			// date. Constructing from local components is what keeps 18:00
			// meaning 18:00 across a daylight-saving change — reattaching the
			// event's stored UTC offset instead would carry a summer offset
			// into winter and shift every later occurrence by an hour.
			const [ y, m, d ] = dateKey.split( '-' ).map( Number );
			const occurrenceStart = new Date(
				y,
				m - 1,
				d,
				start.getHours(),
				start.getMinutes(),
				start.getSeconds()
			);
			result.push( {
				...base,
				id: `${ id }-${ dateKey }`,
				parentId: id,
				startDate: occurrenceStart.toISOString(),
				endDate: new Date(
					occurrenceStart.getTime() + durationMs
				).toISOString(),
			} );
		}
	}

	return result;
}
