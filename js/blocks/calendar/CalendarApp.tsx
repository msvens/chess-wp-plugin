import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { CalendarEvent, EventCategory } from '../../shared/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import {
	buildGrid,
	categoryOrder,
	formatMonthYear,
	formatWeekRange,
	formatDayTitle,
	getWeekDates,
} from './utils';
import type { ViewMode, EventGroupLink } from './utils';
import type { ActiveSelection } from './useDragSelect';
import CalendarHeader from './CalendarHeader';
import CalendarMonth from './CalendarMonth';
import CalendarWeek from './CalendarWeek';
import CalendarDayView from './CalendarDayView';
import EventPopover from './EventPopover';
import DayEventsPopover from './DayEventsPopover';
import CreateEventPopover from './CreateEventPopover';

const VIEW_MODE_KEY = 'rockaden-calendar-view';
const DISMISS_GRACE_MS = 200;

function loadStoredViewMode(): ViewMode {
	if ( typeof window === 'undefined' ) {
		return 'month';
	}
	try {
		const stored = window.localStorage.getItem( VIEW_MODE_KEY );
		if ( stored === 'month' || stored === 'week' || stored === 'day' ) {
			return stored;
		}
	} catch {
		// localStorage may be unavailable (private mode, etc.) — fall back.
	}
	return 'month';
}

interface CalendarAppProps {
	locale: string;
	canEdit: boolean;
	adminBase: string;
}

interface TrainingGroupSummary {
	id: number;
	slug: string;
	title: string;
	eventId: number;
}

export default function CalendarApp( {
	locale,
	canEdit,
	adminBase,
}: CalendarAppProps ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );

	const [ viewMode, setViewMode ] =
		useState< ViewMode >( loadStoredViewMode );
	const [ viewDate, setViewDate ] = useState( () => new Date() );
	const [ events, setEvents ] = useState< CalendarEvent[] >( [] );
	const [ filterCategory, setFilterCategory ] =
		useState< EventCategory | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ eventGroupMap, setEventGroupMap ] = useState<
		Map< number, EventGroupLink[] >
	>( new Map() );
	const [ popoverEvent, setPopoverEvent ] = useState< {
		event: CalendarEvent;
		rect: { top: number; left: number; bottom: number; right: number };
	} | null >( null );
	const [ dayPopover, setDayPopover ] = useState< {
		events: CalendarEvent[];
		dayLabel: string;
		rect: { top: number; left: number; bottom: number; right: number };
	} | null >( null );
	const [ refetchKey, setRefetchKey ] = useState( 0 );
	const [ createPopover, setCreatePopover ] = useState< {
		startISO: string;
		endISO: string;
		rect: { top: number; left: number; bottom: number; right: number };
	} | null >( null );
	const [ activeSelection, setActiveSelection ] =
		useState< ActiveSelection | null >( null );
	// Suppress a fresh create-popover for a short grace period after dismissing
	// one, so a click that closes the popover doesn't immediately re-open it.
	const justDismissedRef = useRef< number >( 0 );

	// Derived year/month from viewDate
	const currentYear = viewDate.getFullYear();
	const currentMonth = viewDate.getMonth();

	// Fetch training groups once to build eventId → group links map
	useEffect( () => {
		apiFetch< TrainingGroupSummary[] >( {
			path: '/rockaden/v1/training-groups',
		} )
			.then( ( groups ) => {
				const map = new Map< number, EventGroupLink[] >();
				for ( const g of groups ) {
					if ( g.eventId > 0 ) {
						const existing = map.get( g.eventId ) || [];
						existing.push( { slug: g.slug, title: g.title } );
						map.set( g.eventId, existing );
					}
				}
				setEventGroupMap( map );
			} )
			.catch( () => {} );
	}, [] );

	// Fetch events when month changes
	useEffect( () => {
		setLoading( true );
		setError( null );

		const monthStr = `${ currentYear }-${ String(
			currentMonth + 1
		).padStart( 2, '0' ) }`;

		apiFetch< CalendarEvent[] >( {
			path: `/rockaden/v1/events?month=${ monthStr }`,
		} )
			.then( ( data ) => {
				setEvents( data );
				setLoading( false );
			} )
			.catch( () => {
				setError( 'Failed to load events' );
				setLoading( false );
			} );
	}, [ currentYear, currentMonth, refetchKey ] );

	const filteredEvents = useMemo(
		() =>
			filterCategory
				? events.filter( ( e ) => e.category === filterCategory )
				: events,
		[ events, filterCategory ]
	);

	const grid = useMemo(
		() => buildGrid( currentYear, currentMonth ),
		[ currentYear, currentMonth ]
	);

	// Navigation — view-mode-aware
	const goToPrev = useCallback( () => {
		setPopoverEvent( null );
		setDayPopover( null );
		setViewDate( ( d ) => {
			const next = new Date( d );
			if ( viewMode === 'month' ) {
				next.setMonth( next.getMonth() - 1 );
			} else if ( viewMode === 'week' ) {
				next.setDate( next.getDate() - 7 );
			} else {
				next.setDate( next.getDate() - 1 );
			}
			return next;
		} );
	}, [ viewMode ] );

	const goToNext = useCallback( () => {
		setPopoverEvent( null );
		setDayPopover( null );
		setViewDate( ( d ) => {
			const next = new Date( d );
			if ( viewMode === 'month' ) {
				next.setMonth( next.getMonth() + 1 );
			} else if ( viewMode === 'week' ) {
				next.setDate( next.getDate() + 7 );
			} else {
				next.setDate( next.getDate() + 1 );
			}
			return next;
		} );
	}, [ viewMode ] );

	const goToToday = useCallback( () => {
		setPopoverEvent( null );
		setDayPopover( null );
		setViewDate( new Date() );
	}, [] );

	const handleViewModeChange = useCallback( ( mode: ViewMode ) => {
		setViewMode( mode );
		setPopoverEvent( null );
		setDayPopover( null );
		if ( typeof window !== 'undefined' ) {
			try {
				window.localStorage.setItem( VIEW_MODE_KEY, mode );
			} catch {
				// localStorage may be unavailable; ignore.
			}
		}
	}, [] );

	const handleDrillToDay = useCallback( ( date: Date ) => {
		setViewDate( date );
		setViewMode( 'day' );
		setPopoverEvent( null );
		setDayPopover( null );
		if ( typeof window !== 'undefined' ) {
			try {
				window.localStorage.setItem( VIEW_MODE_KEY, 'day' );
			} catch {
				// localStorage may be unavailable; ignore.
			}
		}
	}, [] );

	const handleSelectEvent = useCallback(
		(
			event: CalendarEvent,
			rect: { top: number; left: number; bottom: number; right: number }
		) => {
			setDayPopover( null );
			setPopoverEvent( ( prev ) =>
				prev?.event.id === event.id ? null : { event, rect }
			);
		},
		[]
	);

	const handleDaySelect = useCallback(
		(
			dayEvents: CalendarEvent[],
			rect: { top: number; left: number; bottom: number; right: number }
		) => {
			setPopoverEvent( null );
			// Build a day label from the first event's date
			const d = new Date( dayEvents[ 0 ].startDate );
			const label = d.toLocaleDateString( locale.replace( '_', '-' ), {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
			} );
			setDayPopover( {
				events: dayEvents,
				dayLabel: label.charAt( 0 ).toUpperCase() + label.slice( 1 ),
				rect,
			} );
		},
		[ locale ]
	);

	const handleEventDeleted = useCallback( ( deletedEvent: CalendarEvent ) => {
		const parentId = deletedEvent.parentId
			? Number( deletedEvent.parentId )
			: Number( deletedEvent.id );
		// Optimistic local-state filter: drop the deleted occurrence (or all occurrences of the series).
		setEvents( ( prev ) =>
			prev.filter( ( e ) => {
				if ( e.id === deletedEvent.id ) {
					return false;
				}
				// If we deleted the whole series (parent post), strip all siblings too.
				const eParentId = e.parentId
					? Number( e.parentId )
					: Number( e.id );
				if ( ! deletedEvent.parentId && eParentId === parentId ) {
					return false;
				}
				return true;
			} )
		);
		setPopoverEvent( null );
		setDayPopover( null );
		setRefetchKey( ( k ) => k + 1 );
	}, [] );

	const handleCreateAt = useCallback(
		(
			startISO: string,
			endISO: string,
			anchorRect: {
				top: number;
				left: number;
				bottom: number;
				right: number;
			}
		) => {
			// Swallow create-events that fire within the grace window after a
			// dismiss (so clicking outside the popover doesn't immediately
			// re-open one at the new click location).
			if ( Date.now() - justDismissedRef.current < DISMISS_GRACE_MS ) {
				return;
			}
			setPopoverEvent( null );
			setDayPopover( null );
			setCreatePopover( {
				startISO,
				endISO,
				rect: anchorRect,
			} );
		},
		[]
	);

	const dismissCreatePopover = useCallback( () => {
		justDismissedRef.current = Date.now();
		setCreatePopover( null );
		setActiveSelection( null );
	}, [] );

	const handleCreateConfirm = useCallback( () => {
		if ( ! createPopover ) {
			return;
		}
		const url =
			`${ adminBase }post-new.php?post_type=rc_event` +
			`&start=${ encodeURIComponent(
				createPopover.startISO
			) }&end=${ encodeURIComponent( createPopover.endISO ) }`;
		window.location.assign( url );
	}, [ adminBase, createPopover ] );

	// Compute title based on view mode
	const headerTitle = useMemo( () => {
		if ( viewMode === 'month' ) {
			return formatMonthYear( currentYear, currentMonth, locale );
		}
		if ( viewMode === 'week' ) {
			const weekDates = getWeekDates( viewDate );
			return formatWeekRange( weekDates, locale );
		}
		return formatDayTitle( viewDate, locale );
	}, [ viewMode, viewDate, currentYear, currentMonth, locale ] );

	return (
		<div className="rc-cal">
			<CalendarHeader
				title={ headerTitle }
				locale={ locale }
				todayLabel={ t.calendar.today }
				categories={ categoryOrder }
				categoryLabels={ t.calendar.eventCategories }
				allLabel={ t.calendar.allCategories }
				filterCategory={ filterCategory }
				onFilterChange={ setFilterCategory }
				viewMode={ viewMode }
				viewModeLabels={ {
					month: t.calendar.month,
					week: t.calendar.week,
					day: t.calendar.day,
				} }
				onViewModeChange={ handleViewModeChange }
				onPrev={ goToPrev }
				onNext={ goToNext }
				onToday={ goToToday }
			/>

			{ loading && (
				<p className="rc-cal__loading">{ t.common.loading }</p>
			) }

			{ error && <p className="rc-cal__error">{ error }</p> }

			{ ! loading && ! error && viewMode === 'month' && (
				<CalendarMonth
					grid={ grid }
					year={ currentYear }
					month={ currentMonth }
					events={ filteredEvents }
					t={ t.calendar }
					onSelectEvent={ handleSelectEvent }
					onDaySelect={ handleDaySelect }
					canEdit={ canEdit }
					onCreateAt={ handleCreateAt }
				/>
			) }

			{ ! loading && ! error && viewMode === 'week' && (
				<CalendarWeek
					viewDate={ viewDate }
					events={ filteredEvents }
					locale={ locale }
					t={ t.calendar }
					onDrillToDay={ handleDrillToDay }
					onSelectEvent={ handleSelectEvent }
					canEdit={ canEdit }
					onCreateAt={ handleCreateAt }
					activeSelection={ activeSelection }
					setActiveSelection={ setActiveSelection }
				/>
			) }

			{ ! loading && ! error && viewMode === 'day' && (
				<CalendarDayView
					viewDate={ viewDate }
					events={ filteredEvents }
					locale={ locale }
					t={ t.calendar }
					eventGroupMap={ eventGroupMap }
					onSelectEvent={ handleSelectEvent }
					canEdit={ canEdit }
					onCreateAt={ handleCreateAt }
					activeSelection={ activeSelection }
					setActiveSelection={ setActiveSelection }
				/>
			) }

			{ popoverEvent && (
				<EventPopover
					event={ popoverEvent.event }
					anchorRect={ popoverEvent.rect }
					t={ t.calendar }
					commonT={ t.common }
					eventGroupMap={ eventGroupMap }
					onClose={ () => setPopoverEvent( null ) }
					canEdit={ canEdit }
					adminBase={ adminBase }
					onDeleted={ handleEventDeleted }
				/>
			) }

			{ dayPopover && (
				<DayEventsPopover
					events={ dayPopover.events }
					dayLabel={ dayPopover.dayLabel }
					anchorRect={ dayPopover.rect }
					t={ t.calendar }
					commonT={ t.common }
					eventGroupMap={ eventGroupMap }
					onClose={ () => setDayPopover( null ) }
					canEdit={ canEdit }
					adminBase={ adminBase }
					onDeleted={ handleEventDeleted }
				/>
			) }

			{ createPopover && (
				<CreateEventPopover
					anchorRect={ createPopover.rect }
					startISO={ createPopover.startISO }
					endISO={ createPopover.endISO }
					locale={ locale }
					t={ t.calendar }
					onCancel={ dismissCreatePopover }
					onCreate={ handleCreateConfirm }
				/>
			) }
		</div>
	);
}
