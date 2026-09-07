import { useEffect, useRef, useState } from '@wordpress/element';
import type { Translations } from '../../shared/translations';
import { formatTime, toLocaleTag } from './utils';

export interface AttachTarget {
	eventId: number;
	title: string;
}

interface CreateEventPopoverProps {
	anchorRect: { top: number; left: number; bottom: number; right: number };
	startISO: string;
	endISO: string;
	locale: string;
	t: Translations[ 'calendar' ];
	onCancel: () => void;
	onCreate: () => void;
	// Events this slot can be added to as an extra session. Empty hides the
	// option entirely — there is nothing to attach to.
	attachTargets: AttachTarget[];
	onAttach: ( eventId: number ) => void;
	attachBusy: boolean;
}

function formatDayShort( dateISO: string, locale: string ): string {
	// dateISO is "YYYY-MM-DDTHH:mm". Build a Date in local time from the parts
	// to dodge any UTC-shift surprises from the bare ISO string.
	const datePart = dateISO.substring( 0, 10 );
	const [ y, m, d ] = datePart.split( '-' ).map( Number );
	const date = new Date( y, m - 1, d );
	const formatted = date.toLocaleDateString( toLocaleTag( locale ), {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	} );
	return formatted.charAt( 0 ).toUpperCase() + formatted.slice( 1 );
}

export default function CreateEventPopover( {
	anchorRect,
	startISO,
	endISO,
	locale,
	t,
	onCancel,
	onCreate,
	attachTargets,
	onAttach,
	attachBusy,
}: CreateEventPopoverProps ) {
	const ref = useRef< HTMLDivElement >( null );
	// Attaching is the second-choice action, so it stays folded away until
	// asked for: creating a new event is what this popover has always done and
	// what most drags mean.
	const [ attaching, setAttaching ] = useState( false );
	const [ target, setTarget ] = useState( 0 );

	// Position near the anchor, keeping within viewport.
	useEffect( () => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}

		const popoverWidth = el.offsetWidth;
		const popoverHeight = el.offsetHeight;
		const padding = 8;

		// Prefer right of anchor; flip to left if it overflows.
		let left = anchorRect.right + padding;
		if ( left + popoverWidth > window.innerWidth - padding ) {
			left = anchorRect.left - popoverWidth - padding;
		}
		if ( left < padding ) {
			left = padding;
		}

		// Vertically align with anchor top.
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

	// Outside-click dismiss.
	useEffect( () => {
		function handleClick( e: MouseEvent ) {
			if ( ref.current && ! ref.current.contains( e.target as Node ) ) {
				onCancel();
			}
		}
		// Delay so the click that opened the popover doesn't immediately close it.
		const timer = setTimeout( () => {
			document.addEventListener( 'mousedown', handleClick );
		}, 0 );
		return () => {
			clearTimeout( timer );
			document.removeEventListener( 'mousedown', handleClick );
		};
	}, [ onCancel ] );

	// Escape dismisses.
	useEffect( () => {
		function handleKey( e: KeyboardEvent ) {
			if ( e.key === 'Escape' ) {
				onCancel();
			}
		}
		document.addEventListener( 'keydown', handleKey );
		return () => document.removeEventListener( 'keydown', handleKey );
	}, [ onCancel ] );

	const dayLabel = formatDayShort( startISO, locale );
	const startTime = formatTime( startISO );
	const endTime = formatTime( endISO );

	return (
		<div
			className="rc-cal__popover rc-cal__create-popover"
			ref={ ref }
			role="dialog"
			aria-modal="true"
		>
			<p className="rc-cal__create-time">
				{ dayLabel }, { startTime }–{ endTime }
			</p>
			<button
				type="button"
				className="rc-cal__btn rc-cal__btn--primary"
				onClick={ onCreate }
			>
				<svg
					className="rc-cal__btn-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				<span>{ t.createEvent }</span>
			</button>
			{ attachTargets.length > 0 && ! attaching && (
				<button
					type="button"
					className="rc-cal__btn rc-cal__btn--secondary"
					onClick={ () => setAttaching( true ) }
				>
					<span>{ t.addToExisting }</span>
				</button>
			) }
			{ attaching && (
				<div className="rc-cal__attach">
					<label
						className="rc-cal__attach-label"
						htmlFor="rc-cal-attach-target"
					>
						{ t.addToExisting }
					</label>
					<select
						id="rc-cal-attach-target"
						className="rc-cal__attach-select"
						value={ target }
						onChange={ ( e ) =>
							setTarget( Number( e.target.value ) )
						}
					>
						<option value={ 0 }>{ t.chooseOne }</option>
						{ attachTargets.map( ( item ) => (
							<option key={ item.eventId } value={ item.eventId }>
								{ item.title }
							</option>
						) ) }
					</select>
					<button
						type="button"
						className="rc-cal__btn rc-cal__btn--primary"
						disabled={ target === 0 || attachBusy }
						onClick={ () => onAttach( target ) }
					>
						<span>{ attachBusy ? t.saving : t.addSession }</span>
					</button>
				</div>
			) }
		</div>
	);
}
