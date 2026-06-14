import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { GridCell, RowSegment } from './utils';
import {
	groupEventsByDay,
	splitEvents,
	cellKey,
	clipSpanToWindow,
	packRow,
	MONTH_MAX_LANES,
	MONTH_LANE_H,
} from './utils';
import CalendarDay from './CalendarDay';
import EventBar from './EventBar';

type Rect = { top: number; left: number; bottom: number; right: number };

interface CalendarMonthProps {
	grid: GridCell[];
	year: number;
	month: number;
	events: CalendarEvent[];
	t: Translations[ 'calendar' ];
	onSelectEvent: ( event: CalendarEvent, rect: Rect ) => void;
	onDaySelect: ( events: CalendarEvent[], rect: Rect ) => void;
	canEdit: boolean;
	onCreateAt: ( startISO: string, endISO: string, anchorRect: Rect ) => void;
}

const dayKeys = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ] as const;

export default function CalendarMonth( {
	grid,
	year,
	month,
	events,
	t,
	onSelectEvent,
	onDaySelect,
	canEdit,
	onCreateAt,
}: CalendarMonthProps ) {
	// Multi-day events render as spanning bars; the rest keep the pill path.
	const { spanning, timed } = splitEvents( events );
	const grouped = groupEventsByDay( timed, year, month );

	// Chunk the flat grid into week rows of 7.
	const weeks: GridCell[][] = [];
	for ( let i = 0; i < grid.length; i += 7 ) {
		weeks.push( grid.slice( i, i + 7 ) );
	}

	return (
		<div>
			<div className="rc-cal__daynames">
				{ dayKeys.map( ( key ) => (
					<span key={ key } className="rc-cal__dayname">
						{ t.days[ key ] }
					</span>
				) ) }
			</div>
			<div className="rc-cal__grid">
				{ weeks.map( ( week, wi ) => {
					const keys = week.map( cellKey );
					const segments = spanning
						.map( ( ev ) => clipSpanToWindow( ev, keys ) )
						.filter( ( s ): s is RowSegment => s !== null );
					const packed = packRow( segments );
					const lanesUsed = packed.reduce(
						( max, p ) => Math.max( max, p.laneIndex + 1 ),
						0
					);
					const shownLanes = Math.min( lanesUsed, MONTH_MAX_LANES );
					const hidden = packed.filter(
						( p ) => p.laneIndex >= MONTH_MAX_LANES
					).length;
					const bandHeight = shownLanes * MONTH_LANE_H;

					return (
						<div className="rc-cal__week-row" key={ wi }>
							{ week.map( ( cell ) => {
								const cellEvents = cell.isCurrentMonth
									? grouped[ cell.day ] || []
									: [];
								return (
									<CalendarDay
										key={ `${ cell.year }-${ cell.month }-${ cell.day }` }
										day={ cell.day }
										month={ cell.month }
										year={ cell.year }
										isCurrentMonth={ cell.isCurrentMonth }
										events={ cellEvents }
										bandHeight={ bandHeight }
										t={ t }
										onSelectEvent={ onSelectEvent }
										onDaySelect={ onDaySelect }
										canEdit={
											canEdit && cell.isCurrentMonth
										}
										onCreateAt={ onCreateAt }
									/>
								);
							} ) }
							{ shownLanes > 0 && (
								<div className="rc-cal__bars">
									{ packed
										.filter(
											( p ) =>
												p.laneIndex < MONTH_MAX_LANES
										)
										.map( ( p ) => (
											<EventBar
												key={ p.event.id }
												segment={ p }
												onSelect={ onSelectEvent }
											/>
										) ) }
									{ hidden > 0 && (
										<span className="rc-cal__bars-overflow">
											+{ hidden }
										</span>
									) }
								</div>
							) }
						</div>
					);
				} ) }
			</div>
		</div>
	);
}
