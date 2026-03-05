import type { CalendarEvent } from '../../shared/types';
import { categoryClassMap, formatTime } from './utils';

interface EventPillProps {
	event: CalendarEvent;
	variant: 'compact' | 'full';
}

export default function EventPill( { event, variant }: EventPillProps ) {
	const cls = categoryClassMap[ event.category ];

	if ( variant === 'compact' ) {
		return (
			<span className={ `rc-cal__pill rc-cal__pill--${ cls }` }>
				{ event.title }
			</span>
		);
	}

	const time = formatTime( event.startDate );

	return (
		<span className={ `rc-cal__pill rc-cal__pill--${ cls }` }>
			{ time } &middot; { event.title }
		</span>
	);
}
