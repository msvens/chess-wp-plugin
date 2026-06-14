import type { CalendarEvent } from '../../shared/types';
import { categoryClassMap, formatTime } from './utils';
import type { PackedSegment } from './utils';

type Rect = { top: number; left: number; bottom: number; right: number };

interface EventBarProps {
	segment: PackedSegment;
	// Top offset of lane 0, as a CSS length. Month cells reserve a header band
	// (default); the week/day all-day band starts near its own top.
	baseTop?: string;
	// Number of columns the track spans (7 for a week, 1 for a single day).
	columns?: number;
	onSelect: ( event: CalendarEvent, rect: Rect ) => void;
}

/**
 * A horizontal multi-day spanning bar, positioned within a row by percentage
 * (colOffset/colSpan of `columns`) and lane index. Shows the start/end times
 * on the ends it doesn't continue past, and ◀/▶ where it does.
 * @param root0
 * @param root0.segment
 * @param root0.baseTop
 * @param root0.columns
 * @param root0.onSelect
 */
export default function EventBar( {
	segment,
	baseTop = 'var(--rc-month-bar-top)',
	columns = 7,
	onSelect,
}: EventBarProps ) {
	const {
		event,
		colOffset,
		colSpan,
		laneIndex,
		continuesLeft,
		continuesRight,
	} = segment;
	const cls = categoryClassMap[ event.category ];

	const style: React.CSSProperties = {
		top: `calc(${ baseTop } + ${ laneIndex } * var(--rc-month-lane-h))`,
		left: `calc(${ colOffset } / ${ columns } * 100% + var(--rc-bar-inset))`,
		width: `calc(${ colSpan } / ${ columns } * 100% - 2 * var(--rc-bar-inset))`,
	};

	return (
		<button
			type="button"
			className={ `rc-cal__bar rc-cal__bar--${ cls }` }
			style={ style }
			title={ event.title }
			onClick={ ( e ) => {
				e.stopPropagation();
				onSelect( event, e.currentTarget.getBoundingClientRect() );
			} }
		>
			{ continuesLeft ? (
				<span className="rc-cal__bar-arrow">◀</span>
			) : (
				<span className="rc-cal__bar-time">
					{ formatTime( event.startDate ) }
				</span>
			) }
			<span className="rc-cal__bar-title">{ event.title }</span>
			{ continuesRight ? (
				<span className="rc-cal__bar-arrow">▶</span>
			) : (
				<span className="rc-cal__bar-time">
					{ formatTime( event.endDate ) }
				</span>
			) }
		</button>
	);
}
