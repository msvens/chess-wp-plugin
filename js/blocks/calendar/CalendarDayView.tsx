import { useMemo, useCallback } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { EventGroupLink } from './utils';
import {
	dateKey,
	groupEventsByDate,
	layoutEvents,
	timeToPosition,
	durationToHeight,
	formatTime,
	isToday,
	categoryClassMap,
	TIME_GRID_START,
	TIME_GRID_HOURS,
} from './utils';

interface CalendarDayViewProps {
	viewDate: Date;
	events: CalendarEvent[];
	locale: string;
	t: Translations[ 'calendar' ];
	eventGroupMap: Map< number, EventGroupLink[] >;
	onSelectEvent: (
		event: CalendarEvent,
		rect: { top: number; left: number; bottom: number; right: number }
	) => void;
}

export default function CalendarDayView( {
	viewDate,
	events,
	t,
	eventGroupMap,
	onSelectEvent,
}: CalendarDayViewProps ) {
	const key = dateKey( viewDate );
	const grouped = useMemo( () => groupEventsByDate( events ), [ events ] );
	const dayEvents = grouped[ key ] || [];
	const slots = layoutEvents( dayEvents );

	const hours = Array.from(
		{ length: TIME_GRID_HOURS },
		( _, i ) => TIME_GRID_START + i
	);

	const today = isToday(
		viewDate.getFullYear(),
		viewDate.getMonth(),
		viewDate.getDate()
	);

	const now = new Date();
	let nowPosition = 0;
	if ( today ) {
		const nowHours = now.getHours() + now.getMinutes() / 60;
		nowPosition =
			( ( nowHours - TIME_GRID_START ) / TIME_GRID_HOURS ) * 100;
	}

	const handleEventClick = useCallback(
		( evt: CalendarEvent, e: React.MouseEvent< HTMLDivElement > ) => {
			const rect = e.currentTarget.getBoundingClientRect();
			onSelectEvent( evt, {
				top: rect.top,
				left: rect.left,
				bottom: rect.bottom,
				right: rect.right,
			} );
		},
		[ onSelectEvent ]
	);

	return (
		<div className="rc-cal__timegrid rc-cal__dayview">
			<div className="rc-cal__timegrid-body">
				<div className="rc-cal__gutter">
					{ hours.map( ( h ) => (
						<div key={ h } className="rc-cal__time-label">
							{ `${ String( h ).padStart( 2, '0' ) }:00` }
						</div>
					) ) }
				</div>

				<div className="rc-cal__day-col">
					{ hours.map( ( h ) => (
						<div key={ h } className="rc-cal__hour-line" />
					) ) }

					{ slots.map( ( slot ) => {
						const cls = categoryClassMap[ slot.event.category ];
						const top = timeToPosition( slot.event.startDate );
						const height = durationToHeight(
							slot.event.startDate,
							slot.event.endDate
						);
						const width = 100 / slot.totalColumns;
						const left = slot.column * width;

						const originalId = slot.event.parentId
							? Number( slot.event.parentId )
							: Number( slot.event.id );
						const linkedGroups =
							eventGroupMap.get( originalId ) || [];

						return (
							<div
								key={ slot.event.id }
								className={ `rc-cal__time-event rc-cal__time-event--${ cls }` }
								style={ {
									top: `${ top }%`,
									height: `${ Math.max( height, 1.5 ) }%`,
									left: `${ left }%`,
									width: `calc(${ width }% - 2px)`,
								} }
								onClick={ ( e ) =>
									handleEventClick( slot.event, e )
								}
								role="button"
								tabIndex={ 0 }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' || e.key === ' ' ) {
										const rect =
											e.currentTarget.getBoundingClientRect();
										onSelectEvent( slot.event, rect );
									}
								} }
							>
								<div className="rc-cal__time-event-title">
									{ slot.event.title }
								</div>
								<div className="rc-cal__time-event-time">
									{ formatTime( slot.event.startDate ) }–
									{ formatTime( slot.event.endDate ) }
								</div>
								{ slot.event.location && (
									<div className="rc-cal__time-event-location">
										{ t.location }: { slot.event.location }
									</div>
								) }
								{ linkedGroups.length > 0 && (
									<ul className="rc-cal__event-groups">
										{ linkedGroups.map( ( g ) => (
											<li key={ g.slug }>
												<a
													className="rc-cal__event-group-link"
													href={ `/training-groups/${ g.slug }/` }
												>
													{ g.title }
												</a>
											</li>
										) ) }
									</ul>
								) }
							</div>
						);
					} ) }

					{ today && nowPosition > 0 && nowPosition < 100 && (
						<div
							className="rc-cal__now-line"
							style={ { top: `${ nowPosition }%` } }
						/>
					) }
				</div>
			</div>
		</div>
	);
}
