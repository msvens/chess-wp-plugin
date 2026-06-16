import { useMemo, useCallback, useRef } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { EventGroupLink, RowSegment } from './utils';
import {
	dateKey,
	groupEventsByDate,
	splitEvents,
	clipSpanToWindow,
	packRow,
	layoutEvents,
	timeToPosition,
	durationToHeight,
	formatTime,
	isToday,
	categoryClassMap,
	MONTH_LANE_H,
	TIME_GRID_START,
	TIME_GRID_HOURS,
} from './utils';
import { useDragSelect } from './useDragSelect';
import type { ActiveSelection } from './useDragSelect';
import { useTimegridScroll } from './useTimegridScroll';
import EventBar from './EventBar';

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
	canEdit: boolean;
	onCreateAt: (
		startISO: string,
		endISO: string,
		anchorRect: {
			top: number;
			left: number;
			bottom: number;
			right: number;
		}
	) => void;
	activeSelection: ActiveSelection | null;
	setActiveSelection: ( sel: ActiveSelection | null ) => void;
}

export default function CalendarDayView( {
	viewDate,
	events,
	t,
	eventGroupMap,
	onSelectEvent,
	canEdit,
	onCreateAt,
	activeSelection,
	setActiveSelection,
}: CalendarDayViewProps ) {
	const key = dateKey( viewDate );
	// Multi-day events go in the all-day band; the grid only sees timed events.
	const { spanning, timed } = useMemo(
		() => splitEvents( events ),
		[ events ]
	);
	const grouped = useMemo( () => groupEventsByDate( timed ), [ timed ] );
	const dayEvents = grouped[ key ] || [];
	const slots = layoutEvents( dayEvents );

	const bandPacked = useMemo( () => {
		const segments = spanning
			.map( ( ev ) => clipSpanToWindow( ev, [ key ] ) )
			.filter( ( s ): s is RowSegment => s !== null );
		return packRow( segments );
	}, [ spanning, key ] );
	const bandLanes = bandPacked.reduce(
		( max, p ) => Math.max( max, p.laneIndex + 1 ),
		0
	);
	const { onPointerDown, overlayStyle } = useDragSelect(
		key,
		canEdit,
		onCreateAt,
		activeSelection,
		setActiveSelection
	);

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

	// On open, centre the page on "now" when viewing today.
	const gridRef = useRef< HTMLDivElement >( null );
	useTimegridScroll( gridRef, today && nowPosition > 0 && nowPosition < 100 );

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
		<div className="rc-cal__timegrid rc-cal__dayview" ref={ gridRef }>
			{ /* All-day band: multi-day spanning bars above the hour grid */ }
			{ bandLanes > 0 && (
				<div className="rc-cal__allday">
					<div className="rc-cal__allday-gutter">{ t.allDay }</div>
					<div
						className="rc-cal__allday-track"
						style={ { height: bandLanes * MONTH_LANE_H + 4 } }
					>
						{ bandPacked.map( ( p ) => (
							<EventBar
								key={ p.event.id }
								segment={ p }
								baseTop="2px"
								columns={ 1 }
								onSelect={ onSelectEvent }
							/>
						) ) }
					</div>
				</div>
			) }

			<div className="rc-cal__timegrid-body">
				<div className="rc-cal__gutter">
					{ hours.map( ( h ) => (
						<div key={ h } className="rc-cal__time-label">
							{ `${ String( h ).padStart( 2, '0' ) }:00` }
						</div>
					) ) }
				</div>

				<div
					className="rc-cal__day-col"
					onPointerDown={ onPointerDown }
				>
					{ hours.map( ( h ) => (
						<div key={ h } className="rc-cal__hour-line" />
					) ) }

					{ overlayStyle && (
						<div
							className="rc-cal__drag-overlay"
							style={ overlayStyle }
						/>
					) }

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
													href={ `/training/${ g.slug }/` }
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
