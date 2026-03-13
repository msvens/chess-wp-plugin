import { useEffect, useRef } from '@wordpress/element';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import type { EventGroupLink } from './utils';
import { categoryClassMap, formatTime } from './utils';

interface EventPopoverProps {
	event: CalendarEvent;
	anchorRect: { top: number; left: number; bottom: number; right: number };
	t: Translations[ 'calendar' ];
	eventGroupMap: Map< number, EventGroupLink[] >;
	onClose: () => void;
}

export default function EventPopover( {
	event,
	anchorRect,
	t,
	eventGroupMap,
	onClose,
}: EventPopoverProps ) {
	const ref = useRef< HTMLDivElement >( null );

	// Position the popover near the anchor, keeping it within the viewport
	useEffect( () => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}

		const popoverWidth = el.offsetWidth;
		const popoverHeight = el.offsetHeight;
		const padding = 8;

		// Try to place to the right of the anchor
		let left = anchorRect.right + padding;
		if ( left + popoverWidth > window.innerWidth - padding ) {
			// Fall back to left side
			left = anchorRect.left - popoverWidth - padding;
		}
		if ( left < padding ) {
			left = padding;
		}

		// Vertically align with anchor top, but keep within viewport
		let top = anchorRect.top;
		if ( top + popoverHeight > window.innerHeight - padding ) {
			top = window.innerHeight - popoverHeight - padding;
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
		// Delay adding the listener so the click that opened the popover
		// doesn't immediately close it
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

	const cls = categoryClassMap[ event.category ];
	const startTime = formatTime( event.startDate );
	const endTime = formatTime( event.endDate );
	const originalId = event.parentId
		? Number( event.parentId )
		: Number( event.id );
	const linkedGroups = eventGroupMap.get( originalId ) || [];

	return (
		<div className="rc-cal__popover" ref={ ref }>
			<div className="rc-cal__popover-header">
				<div className="rc-cal__event-body">
					<p className="rc-cal__event-title">{ event.title }</p>
					<div className="rc-cal__event-meta">
						<span className="rc-cal__event-meta-item">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
							{ startTime }–{ endTime }
						</span>
						{ event.location && (
							<span className="rc-cal__event-meta-item">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								{ event.location }
							</span>
						) }
					</div>
				</div>
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

			{ event.description && (
				<p className="rc-cal__event-desc">{ event.description }</p>
			) }

			<span
				className={ `rc-cal__event-category rc-cal__event-category--${ cls }` }
			>
				{ t.eventCategories[ event.category ] }
			</span>

			{ event.link && (
				<>
					{ ' ' }
					<a
						className="rc-cal__event-link"
						href={ event.link }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ event.linkLabel || event.link }
					</a>
				</>
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
	);
}
