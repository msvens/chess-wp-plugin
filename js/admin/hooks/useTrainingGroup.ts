import { useState, useEffect, useCallback } from '@wordpress/element';
import type { TrainingGroup, TrainingSession, EventData } from '../types';
import { fetchGroup, fetchSessions, fetchEvent } from '../api';
import { expandRecurringEvents } from '../../shared';

function toDateKey( d: Date ): string {
	const y = d.getFullYear();
	const m = String( d.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( d.getDate() ).padStart( 2, '0' );
	return `${ y }-${ m }-${ day }`;
}

export function useTrainingGroup( groupId: number ) {
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ event, setEvent ] = useState< EventData | null >( null );
	const [ scheduleDates, setScheduleDates ] = useState< string[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	const load = useCallback( async () => {
		setLoading( true );
		setError( null );
		try {
			const [ g, s ] = await Promise.all( [
				fetchGroup( groupId ),
				fetchSessions( groupId ),
			] );
			setGroup( g );
			setSessions( s );

			// Fetch linked event and compute schedule dates
			if ( g.eventId > 0 ) {
				const ev = await fetchEvent( g.eventId );
				setEvent( ev );

				const expanded = expandRecurringEvents( [ ev ] );
				const dates = expanded.map( ( e ) =>
					toDateKey( new Date( e.startDate ) )
				);
				setScheduleDates( dates );
			} else {
				setEvent( null );
				setScheduleDates( [] );
			}
		} catch ( err: any ) {
			setError( err?.message || 'Failed to load training group' );
		} finally {
			setLoading( false );
		}
	}, [ groupId ] );

	useEffect( () => {
		load();
	}, [ load ] );

	return {
		group,
		sessions,
		event,
		scheduleDates,
		loading,
		error,
		refetch: load,
		setGroup,
		setSessions,
	};
}
