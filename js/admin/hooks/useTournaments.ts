import { useState, useEffect, useCallback } from '@wordpress/element';
import type {
	Tournament,
	TournamentCategory,
	TournamentStatus,
} from '../types';
import { fetchTournaments } from '../api';

export interface TournamentFilters {
	status?: TournamentStatus;
	category?: TournamentCategory;
}

export function useTournaments( filters?: TournamentFilters ) {
	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	const load = useCallback( async () => {
		setLoading( true );
		setError( null );
		try {
			const data = await fetchTournaments( filters );
			setTournaments( data );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to load tournaments' );
		} finally {
			setLoading( false );
		}
	}, [ filters?.status, filters?.category ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		load();
	}, [ load ] );

	return { tournaments, loading, error, refetch: load };
}
