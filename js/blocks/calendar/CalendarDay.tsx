import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import { categoryClassMap, isToday } from './utils';
import EventPill from './EventPill';

const MAX_PILLS = 2;
const MAX_DOTS = 4;

interface CalendarDayProps {
	day: number;
	month: number;
	year: number;
	isCurrentMonth: boolean;
	events: CalendarEvent[];
	t: Translations[ 'calendar' ];
	onSelectEvent: (
		event: CalendarEvent,
		rect: { top: number; left: number; bottom: number; right: number }
	) => void;
}

export default function CalendarDay( {
	day,
	month,
	year,
	isCurrentMonth,
	events,
	t,
	onSelectEvent,
}: CalendarDayProps ) {
	const today = isToday( year, month, day );
	const classes = [
		'rc-cal__day',
		! isCurrentMonth && 'rc-cal__day--other-month',
		today && 'rc-cal__day--today',
	]
		.filter( Boolean )
		.join( ' ' );

	const overflow = events.length - MAX_PILLS;

	return (
		<div className={ classes } aria-label={ `${ day }` }>
			<span className="rc-cal__day-number">{ day }</span>

			{ /* Desktop: pills */ }
			<span className="rc-cal__pills">
				{ events.slice( 0, MAX_PILLS ).map( ( ev ) => (
					<EventPill
						key={ ev.id }
						event={ ev }
						variant="compact"
						onClick={ onSelectEvent }
					/>
				) ) }
				{ overflow > 0 && (
					<span className="rc-cal__overflow">
						+{ overflow } { t.moreEvents }
					</span>
				) }
			</span>

			{ /* Mobile: dots */ }
			<span className="rc-cal__dots">
				{ events.slice( 0, MAX_DOTS ).map( ( ev ) => (
					<span
						key={ ev.id }
						className={ `rc-cal__dot rc-cal__dot--${
							categoryClassMap[ ev.category ]
						}` }
					/>
				) ) }
			</span>
		</div>
	);
}
