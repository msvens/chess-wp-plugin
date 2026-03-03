import { useState, useEffect } from '@wordpress/element';
import type { SsfPlayer, SsfRatingInfo } from '../types';
import { fetchClubRatings } from '../api';

export function useSsfRatings( clubId: string ) {
	const [ ratings, setRatings ] = useState< Map< number, SsfRatingInfo > >(
		new Map()
	);
	const [ players, setPlayers ] = useState< SsfPlayer[] >( [] );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! clubId ) {
			setLoading( false );
			return;
		}

		let cancelled = false;

		fetchClubRatings( clubId )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				setPlayers( data );
				const map = new Map< number, SsfRatingInfo >();
				for ( const p of data ) {
					if ( p.elo ) {
						map.set( p.id, {
							rating: p.elo.rating,
							title: p.elo.title,
							rapidRating: p.elo.rapidRating,
							blitzRating: p.elo.blitzRating,
						} );
					}
				}
				setRatings( map );
			} )
			.catch( () => {
				// SSF ratings are nice-to-have, don't block UI
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ clubId ] );

	return { ratings, players, loading };
}
