import { useState, useEffect, useCallback } from '@wordpress/element';
import type { Tournament } from '../types';
import { fetchTournament } from '../api';

export function useTournament( tournamentId: number ) {
	const [ tournament, setTournament ] = useState< Tournament | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	const load = useCallback( async () => {
		setLoading( true );
		setError( null );
		try {
			const data = await fetchTournament( tournamentId );
			setTournament( data );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to load tournament' );
		} finally {
			setLoading( false );
		}
	}, [ tournamentId ] );

	useEffect( () => {
		load();
	}, [ load ] );

	return { tournament, loading, error, refetch: load };
}
