import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { Tournament } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import TournamentCard from './TournamentCard';

interface Props {
	locale: string;
}

const STATUS_ORDER: Record< Tournament[ 'status' ], number > = {
	active: 0,
	planned: 1,
	completed: 2,
};

export default function TournamentsApp( { locale }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		apiFetch< Tournament[] >( { path: '/rockaden/v1/tournaments' } )
			.then( ( data ) => {
				const sorted = [ ...data ].sort( ( a, b ) => {
					const diff =
						STATUS_ORDER[ a.status ] - STATUS_ORDER[ b.status ];
					if ( diff !== 0 ) {
						return diff;
					}
					return a.title.localeCompare( b.title );
				} );
				setTournaments( sorted );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	const [ showPast, setShowPast ] = useState( false );

	if ( loading ) {
		return <p className="rc-tn__loading">{ t.common.loading }</p>;
	}

	if ( tournaments.length === 0 ) {
		return <p className="rc-tn__empty">{ t.tournament.noTournaments }</p>;
	}

	// Ongoing = planned + active; Past = completed (effective status from the API).
	const ongoing = tournaments.filter( ( tn ) => tn.status !== 'completed' );
	const past = tournaments.filter( ( tn ) => tn.status === 'completed' );
	// If there's nothing ongoing, reveal the past list so the block isn't empty.
	const pastVisible = showPast || ongoing.length === 0;

	return (
		<div className="rc-tn">
			{ ongoing.length > 0 && (
				<div className="rc-tn__grid">
					{ ongoing.map( ( tournament ) => (
						<TournamentCard
							key={ tournament.id }
							tournament={ tournament }
							lang={ lang }
						/>
					) ) }
				</div>
			) }

			{ past.length > 0 && (
				<div className="rc-tn__past">
					<button
						type="button"
						className="rc-tn__past-toggle"
						aria-expanded={ pastVisible }
						onClick={ () => setShowPast( ( v ) => ! v ) }
					>
						{ pastVisible ? '▾' : '▸' }{ ' ' }
						{ t.tournament.pastTournaments } ({ past.length })
					</button>
					{ pastVisible && (
						<div className="rc-tn__grid">
							{ past.map( ( tournament ) => (
								<TournamentCard
									key={ tournament.id }
									tournament={ tournament }
									lang={ lang }
								/>
							) ) }
						</div>
					) }
				</div>
			) }
		</div>
	);
}
