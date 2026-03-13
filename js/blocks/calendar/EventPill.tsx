import type { CalendarEvent } from '../../shared/types';
import { categoryClassMap, formatTime } from './utils';

interface EventPillProps {
	event: CalendarEvent;
	variant: 'compact' | 'full';
	onClick?: (
		event: CalendarEvent,
		rect: { top: number; left: number; bottom: number; right: number }
	) => void;
}

export default function EventPill( {
	event,
	variant,
	onClick,
}: EventPillProps ) {
	const cls = categoryClassMap[ event.category ];

	const handleClick = onClick
		? ( e: React.MouseEvent< HTMLSpanElement > ) => {
				e.stopPropagation();
				const rect = e.currentTarget.getBoundingClientRect();
				onClick( event, {
					top: rect.top,
					left: rect.left,
					bottom: rect.bottom,
					right: rect.right,
				} );
		  }
		: undefined;

	if ( variant === 'compact' ) {
		return (
			<span
				className={ `rc-cal__pill rc-cal__pill--${ cls }` }
				onClick={ handleClick }
				role={ onClick ? 'button' : undefined }
				tabIndex={ onClick ? 0 : undefined }
				onKeyDown={
					onClick
						? ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.stopPropagation();
									const rect =
										e.currentTarget.getBoundingClientRect();
									onClick( event, rect );
								}
						  }
						: undefined
				}
			>
				{ event.title }
			</span>
		);
	}

	const time = formatTime( event.startDate );

	return (
		<span
			className={ `rc-cal__pill rc-cal__pill--${ cls }` }
			onClick={ handleClick }
			role={ onClick ? 'button' : undefined }
			tabIndex={ onClick ? 0 : undefined }
			onKeyDown={
				onClick
					? ( e ) => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								e.stopPropagation();
								const rect =
									e.currentTarget.getBoundingClientRect();
								onClick( event, rect );
							}
					  }
					: undefined
			}
		>
			{ time } &middot; { event.title }
		</span>
	);
}
