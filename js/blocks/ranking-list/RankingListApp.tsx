import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { SsfPlayer } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import {
	RATING_TYPES,
	PLAYER_CATEGORIES,
	generateRatingPeriods,
	buildRatingPath,
	getRatingValue,
} from './utils';
import type { RatingType, PlayerCategory } from './utils';
import RankingFilters from './RankingFilters';
import RankingTable from './RankingTable';
import Pagination from './Pagination';

interface Props {
	clubId: string;
	locale: string;
}

function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

const defaultDate = generateRatingPeriods()[ 0 ];

export default function RankingListApp( { clubId, locale }: Props ) {
	const lang = toLanguage( locale );
	const t = getTranslation( lang );

	const [ ratingDate, setRatingDate ] = useState( defaultDate );
	const [ ratingType, setRatingType ] = useState< RatingType >(
		RATING_TYPES.STANDARD
	);
	const [ category, setCategory ] = useState< PlayerCategory >(
		PLAYER_CATEGORIES.ALL
	);
	const [ players, setPlayers ] = useState< SsfPlayer[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ page, setPage ] = useState( 1 );

	useEffect( () => {
		if ( ! clubId ) {
			setLoading( false );
			return;
		}

		let cancelled = false;
		setLoading( true );

		apiFetch< SsfPlayer[] >( {
			path: buildRatingPath( clubId, ratingDate, ratingType, category ),
		} )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				// Sort by rating descending; unrated players go last.
				data.sort( ( a, b ) => {
					const ra = getRatingValue( a.elo, ratingType );
					const rb = getRatingValue( b.elo, ratingType );
					if ( ra && ! rb ) {
						return -1;
					}
					if ( ! ra && rb ) {
						return 1;
					}
					return rb - ra;
				} );
				setPlayers( data );
				setPage( 1 );
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setPlayers( [] );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ clubId, ratingDate, ratingType, category ] );

	return (
		<div className="rc-rl">
			<h2 className="rc-rl__title">{ t.ranking.title }</h2>
			<RankingFilters
				ratingDate={ ratingDate }
				ratingType={ ratingType }
				category={ category }
				onDateChange={ setRatingDate }
				onTypeChange={ setRatingType }
				onCategoryChange={ setCategory }
				t={ t }
			/>
			{ loading ? (
				<p className="rc-rl__loading">{ t.common.loading }</p>
			) : (
				<>
					<RankingTable
						players={ players }
						ratingType={ ratingType }
						page={ page }
						t={ t }
					/>
					<Pagination
						total={ players.length }
						page={ page }
						onPageChange={ setPage }
						t={ t }
					/>
				</>
			) }
		</div>
	);
}
