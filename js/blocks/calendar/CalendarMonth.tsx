import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { GridCell } from './utils';
import { groupEventsByDay } from './utils';
import CalendarDay from './CalendarDay';

interface CalendarMonthProps {
	grid: GridCell[];
	year: number;
	month: number;
	events: CalendarEvent[];
	selectedDay: number | null;
	locale: string;
	t: Translations[ 'calendar' ];
	onSelectDay: ( day: number ) => void;
}

const dayKeys = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ] as const;

export default function CalendarMonth( {
	grid,
	year,
	month,
	events,
	selectedDay,
	locale,
	t,
	onSelectDay,
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
							isSelected={
								cell.isCurrentMonth && cell.day === selectedDay
							}
							events={ cellEvents }
							locale={ locale }
							t={ t }
							onSelect={ onSelectDay }
						/>
					);
				} ) }
			</div>
		</div>
	);
}
