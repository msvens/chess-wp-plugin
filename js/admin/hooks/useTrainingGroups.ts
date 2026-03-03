import { useState, useEffect, useCallback } from '@wordpress/element';
import type { TrainingGroup } from '../types';
import { fetchGroups } from '../api';

export function useTrainingGroups() {
	const [ groups, setGroups ] = useState< TrainingGroup[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	const load = useCallback( async () => {
		setLoading( true );
		setError( null );
		try {
			const data = await fetchGroups();
			setGroups( data );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to load training groups' );
		} finally {
			setLoading( false );
		}
	}, [] );

	useEffect( () => {
		load();
	}, [ load ] );

	return { groups, loading, error, refetch: load };
}
