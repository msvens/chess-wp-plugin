import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { GridCell } from './utils';
import { groupEventsByDay } from './utils';
import CalendarDay from './CalendarDay';

type Rect = { top: number; left: number; bottom: number; right: number };

interface CalendarMonthProps {
	grid: GridCell[];
	year: number;
	month: number;
	events: CalendarEvent[];
	t: Translations[ 'calendar' ];
	onSelectEvent: ( event: CalendarEvent, rect: Rect ) => void;
	onDaySelect: ( events: CalendarEvent[], rect: Rect ) => void;
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
}: CalendarMonthProps ) {
	const grouped = groupEventsByDay( events, year, month );

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
				{ grid.map( ( cell ) => {
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
							t={ t }
							onSelectEvent={ onSelectEvent }
							onDaySelect={ onDaySelect }
						/>
					);
				} ) }
			</div>
		</div>
	);
}
