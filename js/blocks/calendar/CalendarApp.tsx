import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
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
import CalendarHeader from './CalendarHeader';
import CalendarMonth from './CalendarMonth';
import CalendarWeek from './CalendarWeek';
import CalendarDayView from './CalendarDayView';
import EventPopover from './EventPopover';

interface CalendarAppProps {
	locale: string;
}

interface TrainingGroupSummary {
	id: number;
	slug: string;
	title: string;
	eventId: number;
}

export default function CalendarApp( { locale }: CalendarAppProps ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );

	const [ viewMode, setViewMode ] = useState< ViewMode >( 'month' );
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
	}, [ currentYear, currentMonth ] );

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
		setViewDate( new Date() );
	}, [] );

	const handleViewModeChange = useCallback( ( mode: ViewMode ) => {
		setViewMode( mode );
		setPopoverEvent( null );
	}, [] );

	const handleDrillToDay = useCallback( ( date: Date ) => {
		setViewDate( date );
		setViewMode( 'day' );
		setPopoverEvent( null );
	}, [] );

	const handleSelectEvent = useCallback(
		(
			event: CalendarEvent,
			rect: { top: number; left: number; bottom: number; right: number }
		) => {
			setPopoverEvent( ( prev ) =>
				prev?.event.id === event.id ? null : { event, rect }
			);
		},
		[]
	);

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
				/>
			) }

			{ popoverEvent && (
				<EventPopover
					event={ popoverEvent.event }
					anchorRect={ popoverEvent.rect }
					t={ t.calendar }
					eventGroupMap={ eventGroupMap }
					onClose={ () => setPopoverEvent( null ) }
				/>
			) }
		</div>
	);
}
