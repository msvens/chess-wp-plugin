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

function toDateKey( d: Date ): string {
	const y = d.getFullYear();
	const m = String( d.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( d.getDate() ).padStart( 2, '0' );
	return `${ y }-${ m }-${ day }`;
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
		let seriesEnd: Date;
		if ( doc.recurrenceEndDate ) {
			const [ ry, rm, rd ] = doc.recurrenceEndDate
				.substring( 0, 10 )
				.split( '-' )
				.map( Number );
			seriesEnd = new Date( ry, rm - 1, rd, 23, 59, 59 );
		} else {
			seriesEnd = new Date( start );
			seriesEnd.setMonth( seriesEnd.getMonth() + 12 );
		}
		const stepDays = doc.recurrenceType === 'biweekly' ? 14 : 7;
		const excluded = new Set( doc.excludedDates ?? [] );

		const current = new Date( start );
		while ( current <= seriesEnd ) {
			const dateKey = toDateKey( current );
			if ( ! excluded.has( dateKey ) ) {
				const occurrenceStart = new Date( current );
				const occurrenceEnd = new Date(
					current.getTime() + durationMs
				);
				result.push( {
					...base,
					id: `${ id }-${ dateKey }`,
					parentId: id,
					startDate: occurrenceStart.toISOString(),
					endDate: occurrenceEnd.toISOString(),
				} );
			}
			current.setDate( current.getDate() + stepDays );
		}
	}

	return result;
}
