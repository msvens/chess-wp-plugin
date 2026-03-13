import { useEffect, useRef } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { EventGroupLink } from './utils';
import { categoryClassMap, formatTime } from './utils';

interface DayEventsPopoverProps {
	events: CalendarEvent[];
	dayLabel: string;
	anchorRect: { top: number; left: number; bottom: number; right: number };
	t: Translations[ 'calendar' ];
	eventGroupMap: Map< number, EventGroupLink[] >;
	onClose: () => void;
}

export default function DayEventsPopover( {
	events,
	dayLabel,
	anchorRect,
	t,
	eventGroupMap,
	onClose,
}: DayEventsPopoverProps ) {
	const ref = useRef< HTMLDivElement >( null );

	// Position near the anchor, keeping within viewport
	useEffect( () => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}

		const popoverWidth = el.offsetWidth;
		const popoverHeight = el.offsetHeight;
		const padding = 8;

		// Center horizontally over the anchor
		let left =
			anchorRect.left +
			( anchorRect.right - anchorRect.left ) / 2 -
			popoverWidth / 2;
		if ( left + popoverWidth > window.innerWidth - padding ) {
			left = window.innerWidth - popoverWidth - padding;
		}
		if ( left < padding ) {
			left = padding;
		}

		// Place below the anchor
		let top = anchorRect.bottom + padding;
		if ( top + popoverHeight > window.innerHeight - padding ) {
			// Fall back to above anchor
			top = anchorRect.top - popoverHeight - padding;
		}
		if ( top < padding ) {
			top = padding;
		}

		el.style.top = `${ top }px`;
		el.style.left = `${ left }px`;
	}, [ anchorRect ] );

	// Close on outside click
	useEffect( () => {
		function handleClick( e: MouseEvent ) {
			if ( ref.current && ! ref.current.contains( e.target as Node ) ) {
				onClose();
			}
		}
		const timer = setTimeout( () => {
			document.addEventListener( 'mousedown', handleClick );
		}, 0 );
		return () => {
			clearTimeout( timer );
			document.removeEventListener( 'mousedown', handleClick );
		};
	}, [ onClose ] );

	// Close on Escape
	useEffect( () => {
		function handleKey( e: KeyboardEvent ) {
			if ( e.key === 'Escape' ) {
				onClose();
			}
		}
		document.addEventListener( 'keydown', handleKey );
		return () => document.removeEventListener( 'keydown', handleKey );
	}, [ onClose ] );

	return (
		<div className="rc-cal__popover rc-cal__day-popover" ref={ ref }>
			<div className="rc-cal__popover-header">
				<p className="rc-cal__event-title">{ dayLabel }</p>
				<button
					type="button"
					className="rc-cal__popover-close"
					onClick={ onClose }
					aria-label="Close"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<ul className="rc-cal__day-popover-list">
				{ events.map( ( ev ) => {
					const cls = categoryClassMap[ ev.category ];
					const originalId = ev.parentId
						? Number( ev.parentId )
						: Number( ev.id );
					const linkedGroups = eventGroupMap.get( originalId ) || [];
					return (
						<li key={ ev.id } className="rc-cal__day-popover-item">
							<span
								className={ `rc-cal__filter-dot rc-cal__filter-dot--${ cls }` }
							/>
							<div className="rc-cal__day-popover-detail">
								<span className="rc-cal__day-popover-title">
									{ ev.title }
								</span>
								<span className="rc-cal__day-popover-time">
									{ formatTime( ev.startDate ) }–
									{ formatTime( ev.endDate ) }
									{ ev.location && ` · ${ ev.location }` }
								</span>
								<span
									className={ `rc-cal__event-category rc-cal__event-category--${ cls }` }
								>
									{ t.eventCategories[ ev.category ] }
								</span>
								{ ev.link && (
									<a
										className="rc-cal__event-link"
										href={ ev.link }
										target="_blank"
										rel="noopener noreferrer"
									>
										{ ev.linkLabel || ev.link }
									</a>
								) }
								{ linkedGroups.length > 0 && (
									<ul className="rc-cal__event-groups">
										{ linkedGroups.map( ( g ) => (
											<li key={ g.slug }>
												<a
													className="rc-cal__event-group-link"
													href={ `/training-groups/${ g.slug }/` }
												>
													{ g.title }
												</a>
											</li>
										) ) }
									</ul>
								) }
							</div>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
