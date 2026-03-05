import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { CalendarEvent, EventCategory } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import {
	buildGrid,
	groupEventsByDay,
	categoryOrder,
	toLanguage,
} from './utils';
import CalendarHeader from './CalendarHeader';
import CalendarMonth from './CalendarMonth';
import DayDetail from './DayDetail';

interface CalendarAppProps {
	locale: string;
}

export default function CalendarApp( { locale }: CalendarAppProps ) {
	const lang = toLanguage( locale );
	const t = getTranslation( lang );

	const now = new Date();
	const [ currentYear, setCurrentYear ] = useState( now.getFullYear() );
	const [ currentMonth, setCurrentMonth ] = useState( now.getMonth() );
	const [ selectedDay, setSelectedDay ] = useState< number | null >( null );
	const [ events, setEvents ] = useState< CalendarEvent[] >( [] );
	const [ filterCategory, setFilterCategory ] =
		useState< EventCategory | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

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

	const grouped = useMemo(
		() => groupEventsByDay( filteredEvents, currentYear, currentMonth ),
		[ filteredEvents, currentYear, currentMonth ]
	);

	const selectedEvents = selectedDay ? grouped[ selectedDay ] || [] : [];

	const goToPrev = useCallback( () => {
		setSelectedDay( null );
		if ( currentMonth === 0 ) {
			setCurrentMonth( 11 );
			setCurrentYear( ( y ) => y - 1 );
		} else {
			setCurrentMonth( ( m ) => m - 1 );
		}
	}, [ currentMonth ] );

	const goToNext = useCallback( () => {
		setSelectedDay( null );
		if ( currentMonth === 11 ) {
			setCurrentMonth( 0 );
			setCurrentYear( ( y ) => y + 1 );
		} else {
			setCurrentMonth( ( m ) => m + 1 );
		}
	}, [ currentMonth ] );

	const goToToday = useCallback( () => {
		const today = new Date();
		setCurrentYear( today.getFullYear() );
		setCurrentMonth( today.getMonth() );
		setSelectedDay( today.getDate() );
	}, [] );

	const handleSelectDay = useCallback(
		( day: number ) => {
			setSelectedDay( selectedDay === day ? null : day );
		},
		[ selectedDay ]
	);

	return (
		<div className="rc-cal">
			<CalendarHeader
				year={ currentYear }
				month={ currentMonth }
				locale={ locale }
				todayLabel={ t.calendar.today }
				categories={ categoryOrder }
				categoryLabels={ t.calendar.eventCategories }
				allLabel={ t.calendar.allCategories }
				filterCategory={ filterCategory }
				onFilterChange={ setFilterCategory }
				onPrev={ goToPrev }
				onNext={ goToNext }
				onToday={ goToToday }
			/>

			{ loading && (
				<p className="rc-cal__loading">{ t.common.loading }</p>
			) }

			{ error && <p className="rc-cal__error">{ error }</p> }

			{ ! loading && ! error && (
				<CalendarMonth
					grid={ grid }
					year={ currentYear }
					month={ currentMonth }
					events={ filteredEvents }
					selectedDay={ selectedDay }
					locale={ locale }
					t={ t.calendar }
					onSelectDay={ handleSelectDay }
				/>
			) }

			{ selectedDay !== null && ! loading && (
				<DayDetail
					day={ selectedDay }
					month={ currentMonth }
					year={ currentYear }
					events={ selectedEvents }
					locale={ locale }
					t={ t.calendar }
					onClose={ () => setSelectedDay( null ) }
				/>
			) }
		</div>
	);
}
