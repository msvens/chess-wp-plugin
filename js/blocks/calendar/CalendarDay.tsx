import { useCallback, useRef } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import { categoryClassMap, isToday } from './utils';
import EventPill from './EventPill';

const MAX_PILLS = 2;
const MAX_DOTS = 4;

type Rect = { top: number; left: number; bottom: number; right: number };

interface CalendarDayProps {
	day: number;
	month: number;
	year: number;
	isCurrentMonth: boolean;
	events: CalendarEvent[];
	t: Translations[ 'calendar' ];
	onSelectEvent: ( event: CalendarEvent, rect: Rect ) => void;
	onDaySelect: ( events: CalendarEvent[], rect: Rect ) => void;
	canEdit: boolean;
	onCreateAt: ( startISO: string, endISO: string, anchorRect: Rect ) => void;
}

export default function CalendarDay( {
	day,
	month,
	year,
	isCurrentMonth,
	events,
	t,
	onSelectEvent,
	onDaySelect,
	canEdit,
	onCreateAt,
}: CalendarDayProps ) {
	const cellRef = useRef< HTMLDivElement >( null );
	const today = isToday( year, month, day );
	const classes = [
		'rc-cal__day',
		! isCurrentMonth && 'rc-cal__day--other-month',
		today && 'rc-cal__day--today',
		events.length > 0 && 'rc-cal__day--has-events',
	]
		.filter( Boolean )
		.join( ' ' );

	const overflow = events.length - MAX_PILLS;

	// Click handling. Pills already stopPropagation, so we only land here when
	// the user clicked the bare cell (or the day-number / pills / dots wrappers).
	// On mobile, tapping a populated cell shows the events popover (existing).
	// Otherwise (admin), trigger create-event for the clicked day.
	const handleCellClick = useCallback(
		( e: React.MouseEvent< HTMLDivElement > ) => {
			const dots = cellRef.current?.querySelector( '.rc-cal__dots' );
			const dotsVisible =
				!! dots && window.getComputedStyle( dots ).display !== 'none';

			// Mobile + populated cell → open the events popover (existing behavior).
			if ( dotsVisible && events.length > 0 ) {
				e.stopPropagation();
				const rect = cellRef.current!.getBoundingClientRect();
				if ( events.length === 1 ) {
					onSelectEvent( events[ 0 ], rect );
				} else {
					onDaySelect( events, rect );
				}
				return;
			}

			// Admin: clicking anywhere on the cell (empty or populated) shows the
			// create-event popover. Pills already consumed their own clicks.
			if ( canEdit ) {
				const mm = String( month + 1 ).padStart( 2, '0' );
				const dd = String( day ).padStart( 2, '0' );
				const dayKey = `${ year }-${ mm }-${ dd }`;
				const anchorRect: Rect = {
					top: e.clientY,
					bottom: e.clientY,
					left: e.clientX,
					right: e.clientX,
				};
				onCreateAt(
					`${ dayKey }T18:00`,
					`${ dayKey }T19:00`,
					anchorRect
				);
			}
		},
		[
			canEdit,
			events,
			month,
			day,
			year,
			onCreateAt,
			onSelectEvent,
			onDaySelect,
		]
	);

	const handleCellKeyDown = useCallback(
		( e: React.KeyboardEvent< HTMLDivElement > ) => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				const dots = cellRef.current?.querySelector( '.rc-cal__dots' );
				if (
					! dots ||
					window.getComputedStyle( dots ).display === 'none'
				) {
					return;
				}
				if ( events.length === 0 ) {
					return;
				}
				const rect = cellRef.current!.getBoundingClientRect();
				if ( events.length === 1 ) {
					onSelectEvent( events[ 0 ], rect );
				} else {
					onDaySelect( events, rect );
				}
			}
		},
		[ events, onSelectEvent, onDaySelect ]
	);

	const hasEvents = events.length > 0;

	return (
		<div
			className={ classes }
			aria-label={ `${ day }` }
			ref={ cellRef }
			onClick={ handleCellClick }
			onKeyDown={ hasEvents ? handleCellKeyDown : undefined }
			role={ hasEvents ? 'button' : undefined }
			tabIndex={ hasEvents ? 0 : undefined }
		>
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
