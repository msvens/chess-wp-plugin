import { useMemo, useCallback } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import {
	getWeekDates,
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

const dayKeys = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ] as const;

interface CalendarWeekProps {
	viewDate: Date;
	events: CalendarEvent[];
	locale: string;
	t: Translations[ 'calendar' ];
	onDrillToDay: ( date: Date ) => void;
	onSelectEvent: (
		event: CalendarEvent,
		rect: { top: number; left: number; bottom: number; right: number }
	) => void;
}

export default function CalendarWeek( {
	viewDate,
	events,
	t,
	onDrillToDay,
	onSelectEvent,
}: CalendarWeekProps ) {
	const weekDates = useMemo( () => getWeekDates( viewDate ), [ viewDate ] );
	const grouped = useMemo( () => groupEventsByDate( events ), [ events ] );

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

	const hours = Array.from(
		{ length: TIME_GRID_HOURS },
		( _, i ) => TIME_GRID_START + i
	);

	// Current time indicator position
	const now = new Date();
	const nowInWeek = weekDates.some(
		( d ) =>
			d.getFullYear() === now.getFullYear() &&
			d.getMonth() === now.getMonth() &&
			d.getDate() === now.getDate()
	);

	let nowPosition = 0;
	if ( nowInWeek ) {
		const nowHours = now.getHours() + now.getMinutes() / 60;
		nowPosition =
			( ( nowHours - TIME_GRID_START ) / TIME_GRID_HOURS ) * 100;
	}

	return (
		<div className="rc-cal__timegrid rc-cal__week">
			{ /* Header row */ }
			<div className="rc-cal__timegrid-header">
				<div className="rc-cal__timegrid-corner" />
				{ weekDates.map( ( date, i ) => {
					const today = isToday(
						date.getFullYear(),
						date.getMonth(),
						date.getDate()
					);
					return (
						<div
							key={ dateKey( date ) }
							className={ `rc-cal__col-header${
								today ? ' rc-cal__col-header--today' : ''
							}` }
							onClick={ () => onDrillToDay( date ) }
							role="button"
							tabIndex={ 0 }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									onDrillToDay( date );
								}
							} }
						>
							<span className="rc-cal__col-day-name">
								{ t.days[ dayKeys[ i ] ] }
							</span>
							<span className="rc-cal__col-day-num">
								{ date.getDate() }
							</span>
						</div>
					);
				} ) }
			</div>

			{ /* Body: gutter + day columns */ }
			<div className="rc-cal__timegrid-body">
				<div className="rc-cal__gutter">
					{ hours.map( ( h ) => (
						<div key={ h } className="rc-cal__time-label">
							{ `${ String( h ).padStart( 2, '0' ) }:00` }
						</div>
					) ) }
				</div>

				{ weekDates.map( ( date ) => {
					const key = dateKey( date );
					const dayEvents = grouped[ key ] || [];
					const slots = layoutEvents( dayEvents );
					const today = isToday(
						date.getFullYear(),
						date.getMonth(),
						date.getDate()
					);

					return (
						<div key={ key } className="rc-cal__day-col">
							{ hours.map( ( h ) => (
								<div key={ h } className="rc-cal__hour-line" />
							) ) }

							{ slots.map( ( slot ) => {
								const cls =
									categoryClassMap[ slot.event.category ];
								const top = timeToPosition(
									slot.event.startDate
								);
								const height = durationToHeight(
									slot.event.startDate,
									slot.event.endDate
								);
								const width = 100 / slot.totalColumns;
								const left = slot.column * width;

								return (
									<div
										key={ slot.event.id }
										className={ `rc-cal__time-event rc-cal__time-event--${ cls }` }
										style={ {
											top: `${ top }%`,
											height: `${ Math.max(
												height,
												1.5
											) }%`,
											left: `${ left }%`,
											width: `calc(${ width }% - 2px)`,
										} }
										title={ `${
											slot.event.title
										} (${ formatTime(
											slot.event.startDate
										) }–${ formatTime(
											slot.event.endDate
										) })` }
										onClick={ ( e ) =>
											handleEventClick( slot.event, e )
										}
										role="button"
										tabIndex={ 0 }
										onKeyDown={ ( e ) => {
											if (
												e.key === 'Enter' ||
												e.key === ' '
											) {
												const rect =
													e.currentTarget.getBoundingClientRect();
												onSelectEvent(
													slot.event,
													rect
												);
											}
										} }
									>
										<div className="rc-cal__time-event-title">
											{ slot.event.title }
										</div>
										<div className="rc-cal__time-event-time">
											{ formatTime(
												slot.event.startDate
											) }
											–
											{ formatTime( slot.event.endDate ) }
										</div>
									</div>
								);
							} ) }

							{ today && nowPosition > 0 && nowPosition < 100 && (
								<div
									className="rc-cal__now-line"
									style={ {
										top: `${ nowPosition }%`,
									} }
								/>
							) }
						</div>
					);
				} ) }
			</div>
		</div>
	);
}
